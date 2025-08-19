import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import InputChatContent from '../components/InputChatContent';
import useChat from '../hooks/useChat';
import { AttachmentType } from '../hooks/useChat';
import ChatMessage from '../components/ChatMessage';
import useScroll from '../hooks/useScroll';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PiArrowsCounterClockwise,

  PiWarningCircleFill,
} from 'react-icons/pi';
import Button from '../components/Button';
import { useTranslation } from 'react-i18next';
import SwitchBedrockModel from '../components/SwitchBedrockModel';
import useSnackbar from '../hooks/useSnackbar';
import useBot from '../hooks/useBot';
import useConversation from '../hooks/useConversation';
import { ActiveModels, BotSummary } from '../@types/bot';
import IconPinnedBot from '../components/IconPinnedBot.tsx';

import { copyBotUrl, isPinnedBot, canBePinned } from '../utils/BotUtils';
import { toCamelCase } from '../utils/StringUtils';
import { produce } from 'immer';
import StatusSyncBot from '../components/StatusSyncBot';
import Alert from '../components/Alert';
import useBotSummary from '../hooks/useBotSummary';
import useModel from '../hooks/useModel';
import {
  AgentState,
  AgentToolsProps,
} from '../features/agent/xstates/agentThink';
import { getRelatedDocumentsOfToolUse } from '../features/agent/utils/AgentUtils';
import { SyncStatus } from '../constants';
import { BottomHelper } from '../features/helper/components/BottomHelper';
import { useIsWindows } from '../hooks/useIsWindows';
import {
  DisplayMessageContent,
  Model,
  PutFeedbackRequest,
} from '../@types/conversation.ts';
import { AVAILABLE_MODEL_KEYS } from '../constants/index';
import usePostMessageStreaming from '../hooks/usePostMessageStreaming.ts';
import useLoginUser from '../hooks/useLoginUser';
import useBotPinning from '../hooks/useBotPinning';
import Skeleton from '../components/Skeleton.tsx';
import { twMerge } from 'tailwind-merge';
import ButtonStar from '../components/ButtonStar.tsx';
import MenuBot from '../components/MenuBot.tsx';
import pravartanamLogo from '../assets/pravartanam.jpg';

// Default model activation settings when no bot is selected
const defaultActiveModels: ActiveModels = (() => {
  return Object.fromEntries(
    AVAILABLE_MODEL_KEYS.map((key: Model) => [toCamelCase(key), true])
  ) as ActiveModels;
})();

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { open: openSnackbar } = useSnackbar();
  const { errorDetail } = usePostMessageStreaming();
  const { isAdmin } = useLoginUser();
  const { pinBot, unpinBot } = useBotPinning();

  const {
    agentThinking,
    reasoningThinking,
    conversationError,
    postingMessage,
    newChat,
    postChat,
    messages,
    conversationId,
    setConversationId,
    hasError,
    retryPostChat,
    setCurrentMessageId,
    regenerate,
    continueGenerate,
    loadingConversation,
    getShouldContinue,
    relatedDocuments,
    giveFeedback,
    reasoningEnabled,
    setReasoningEnabled,
    supportReasoning,
  } = useChat();

  // Error Handling
  useEffect(() => {
    if (conversationError) {
      if (conversationError.response?.status === 404) {
        openSnackbar(t('error.notFoundConversation'));
        newChat();
        navigate('/');
      } else {
        openSnackbar(conversationError.message ?? '');
      }
    }
  }, [conversationError, navigate, newChat, openSnackbar, t]);

  const { isWindows } = useIsWindows();

  const { getBotId } = useConversation();

  const { scrollToBottom, scrollToTop } = useScroll();

  const { conversationId: paramConversationId, botId: paramBotId } =
    useParams();

  const botId = useMemo(() => {
    return paramBotId ?? getBotId(conversationId);
  }, [conversationId, getBotId, paramBotId]);

  const {
    data: bot,
    error: botError,
    isLoading: isLoadingBot,
    mutate: mutateBot,
  } = useBotSummary(botId ?? undefined);

  const [isAvailabilityBot, setIsAvailabilityBot] = useState(false);

  useEffect(() => {
    setIsAvailabilityBot(false);
    if (bot) {
      setIsAvailabilityBot(true);
    }
    if (botError) {
      // redirect to new chat(no bot chat) if not set conversationId
      if (!conversationId) {
        openSnackbar(t('error.cannotAccessBot'));
        newChat();
        navigate('/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, botError]);

  const disabledInput = useMemo(() => {
    return botId !== null && !isAvailabilityBot && !isLoadingBot;
  }, [botId, isAvailabilityBot, isLoadingBot]);

  useEffect(() => {
    setConversationId(paramConversationId ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramConversationId]);

  const inputBotParams = useMemo(() => {
    return botId
      ? {
          botId: botId,
          hasKnowledge: bot?.hasKnowledge ?? false,
          hasAgent: bot?.hasAgent ?? false,
        }
      : undefined;
  }, [bot?.hasKnowledge, botId, bot?.hasAgent]);

  const onSend = useCallback(
    (
      content: string,
      enableReasoning: boolean,
      base64EncodedImages?: string[],
      attachments?: AttachmentType[]
    ) => {
      postChat({
        content,
        base64EncodedImages,
        attachments,
        bot: inputBotParams,
        enableReasoning,
      });
    },
    [inputBotParams, postChat]
  );

  const onChangeCurrentMessageId = useCallback(
    (messageId: string) => {
      setCurrentMessageId(messageId);
    },
    [setCurrentMessageId]
  );

  const onSubmitEditedContent = useCallback(
    (messageId: string, content: string) => {
      if (hasError) {
        retryPostChat({
          content,
          bot: inputBotParams,
          enableReasoning: reasoningEnabled,
        });
      } else {
        regenerate({
          messageId,
          content,
          bot: inputBotParams,
          enableReasoning: reasoningEnabled,
        });
      }
    },
    [hasError, inputBotParams, regenerate, retryPostChat, reasoningEnabled]
  );

  const onRegenerate = useCallback(
    (enableReasoning: boolean) => {
      regenerate({
        bot: inputBotParams,
        enableReasoning,
      });
    },
    [inputBotParams, regenerate]
  );

  const onContinueGenerate = useCallback(() => {
    continueGenerate({ bot: inputBotParams });
  }, [inputBotParams, continueGenerate]);

  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    } else {
      scrollToTop();
    }
  }, [messages, scrollToBottom, scrollToTop]);

  const { updateStarred } = useBot();
  const onClickBotEdit = useCallback(
    (botId: string) => {
      navigate(`/bot/edit/${botId}`);
    },
    [navigate]
  );

  const onClickStar = useCallback(async () => {
    if (!bot) {
      return;
    }
    const isStarred = !bot.isStarred;
    mutateBot(
      produce(bot, (draft) => {
        draft.isStarred = isStarred;
      }),
      {
        revalidate: false,
      }
    );

    updateStarred(bot.id, isStarred).finally(() => {
      mutateBot();
    });
  }, [bot, mutateBot, updateStarred]);

  const onClickCopyUrl = useCallback((botId: string) => {
    copyBotUrl(botId);
  }, []);

  const onClickSyncError = useCallback(() => {
    navigate(`/bot/edit/${bot?.id}`);
  }, [bot?.id, navigate]);

  const { disabledImageUpload } = useModel();
  const [dndMode, setDndMode] = useState(false);
  const onDragOver: React.DragEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (!disabledImageUpload) {
        setDndMode(true);
      }
      e.preventDefault();
    },
    [disabledImageUpload]
  );

  const endDnd: React.DragEventHandler<HTMLDivElement> = useCallback((e) => {
    setDndMode(false);
    e.preventDefault();
  }, []);

  const focusInputRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isNewConversationCommand = (() => {
        if (event.code !== 'KeyO') {
          return false;
        }
        if (isWindows) {
          return event.ctrlKey && event.shiftKey;
        } else {
          return event.metaKey && event.shiftKey;
        }
      })();
      const isFocusChatInputCommand = event.code === 'Escape' && event.shiftKey;

      if (isNewConversationCommand) {
        event.preventDefault();

        if (botId) {
          navigate(`/bot/${botId}`);
        } else {
          navigate('/');
        }
      } else if (isFocusChatInputCommand) {
        focusInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const ChatMessageWithRelatedDocuments: React.FC<{
    chatContent: DisplayMessageContent;
    isStreaming: boolean;
    onChangeMessageId?: (messageId: string) => void;
    onSubmit?: (messageId: string, content: string) => void;
    onSubmitFeedback?: (
      messageId: string,
      feedback: PutFeedbackRequest
    ) => void;
  }> = React.memo((props) => {
    const { chatContent: message } = props;

    const isReasoningActive = reasoningThinking.matches('active');
    const reasoning = useMemo(
      () => ({
        content: isReasoningActive ? reasoningThinking.context.content : '',
      }),
      [isReasoningActive]
    );

    const isAgentThinking = useMemo(
      () =>
        [AgentState.THINKING, AgentState.LEAVING].some(
          (v) => v === agentThinking.value
        ),
      []
    );

    const tools: AgentToolsProps[] | undefined = useMemo(() => {
      // Check if this is normal chat with tools enabled (no bot selected)
      const isNormalChatWithTools = !botId;
      
      if (isAgentThinking) {
        if (agentThinking.context.tools.length > 0) {
          return agentThinking.context.tools;
        }

        // Show thinking progress for bot with agent OR normal chat with tools
        if (bot?.hasAgent || isNormalChatWithTools) {
          return [
            {
              thought: t('agent.progress.label'),
              tools: {},
            },
          ];
        }

        if (bot?.hasKnowledge) {
          return [
            {
              thought: t('bot.label.retrievingKnowledge'), // @@
              tools: {},
            },
          ];
        }

        return undefined;
      } else {
        if (bot?.hasKnowledge) {
          const pseudoToolUseId = message.id;
          const relatedDocumentsOfVectorSearch = getRelatedDocumentsOfToolUse(
            relatedDocuments,
            pseudoToolUseId
          );
          if (
            relatedDocumentsOfVectorSearch != null &&
            relatedDocumentsOfVectorSearch.length > 0
          ) {
            return [
              {
                tools: {
                  [pseudoToolUseId]: {
                    name: 'knowledge_base_tool',
                    status: 'success',
                    input: {},
                    relatedDocuments: relatedDocumentsOfVectorSearch,
                  },
                },
              },
            ];
          }
        }

        return undefined;
      }
    }, [isAgentThinking, message, botId]);

    const relatedDocumentsForCitation = useMemo(
      () =>
        isAgentThinking
          ? agentThinking.context.relatedDocuments
          : relatedDocuments,
      [isAgentThinking]
    );

    return (
      <ChatMessage
        tools={tools}
        reasoning={reasoning}
        chatContent={message}
        isStreaming={props.isStreaming}
        relatedDocuments={relatedDocumentsForCitation}
        onChangeMessageId={props.onChangeMessageId}
        onSubmit={props.onSubmit}
        onSubmitFeedback={props.onSubmitFeedback}
      />
    );
  });

  const activeModels = useMemo(() => {
    if (!bot) {
      return defaultActiveModels;
    }
    const isActiveModelsEmpty =
      Object.keys(bot?.activeModels ?? {}).length === 0;
    return isActiveModelsEmpty ? defaultActiveModels : bot.activeModels;
  }, [bot]);

  const togglePinBot = useCallback(
    (bot: BotSummary) => {
      mutateBot(
        produce(bot, (draft) => {
          draft.sharedStatus = isPinnedBot(bot.sharedStatus)
            ? 'shared'
            : 'pinned@000';
        }),
        {
          revalidate: false,
        }
      );

      isPinnedBot(bot.sharedStatus)
        ? unpinBot(bot.id).finally(() => {
            mutateBot();
          })
        : pinBot(bot.id, 0).finally(() => {
            mutateBot();
          });
    },
    [mutateBot, pinBot, unpinBot]
  );

  const canSwitchPinned = useMemo(() => {
    return isAdmin && canBePinned(bot?.sharedScope ?? 'private');
  }, [bot?.sharedScope, isAdmin]);

  return (
    <div
      className="relative flex h-full flex-1 flex-col"
      onDragOver={onDragOver}
      onDrop={endDnd}
      onDragEnd={endDnd}>
      <div className="flex-1 overflow-hidden">
        <div className="sticky top-0 z-10 mb-4 flex h-24 w-full items-center justify-between border-b border-gray bg-aws-paper-light p-4 sm:p-6 dark:bg-aws-paper-dark">
          <div className="flex w-full justify-between">
            <div className="p-2">
              <div className="flex items-center whitespace-nowrap font-bold">
                {isLoadingBot ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <>
                    <img 
                      src={pravartanamLogo} 
                      alt="Pravartanam Logo" 
                      className="w-[60px] h-[50px] sm:w-[85px] sm:h-[70px] mr-3 object-contain"
                      style={{ marginTop: '11px' }}
                    />
                    <IconPinnedBot
                      botSharedStatus={bot?.sharedStatus}
                      className="mr-1 text-aws-aqua"
                    />
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-xl">SAIL GPT</span>
                      <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Forging The Future With Intelligence Of Tomorrow</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              {!loadingConversation && (
                <>
                  <SwitchBedrockModel
                    className="mr-4"
                    activeModels={activeModels}
                    botId={botId}
                  />
                </>
              )}
              {isLoadingBot && (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="size-7" />
                  <Skeleton className="h-7 w-12" />
                </div>
              )}

              {isAvailabilityBot && !isLoadingBot && (
                <div className="absolute -top-1 right-0 flex h-full items-center">
                  <div className="h-full w-12 bg-gradient-to-r from-transparent to-aws-paper-light dark:to-aws-paper-dark"></div>
                  <div className="flex items-center bg-aws-paper-light dark:bg-aws-paper-dark">
                    {bot?.owned && (
                      <StatusSyncBot
                        syncStatus={bot.syncStatus}
                        onClickError={onClickSyncError}
                      />
                    )}

                    <ButtonStar
                      isStarred={bot?.isStarred ?? false}
                      onClick={onClickStar}
                    />

                    <MenuBot
                      className="mx-1"
                      {...(bot?.owned && {
                        onClickEdit: () => {
                          onClickBotEdit(bot.id);
                        },
                      })}
                      {...(bot?.sharedScope !== 'private' && {
                        onClickCopyUrl: () => {
                          onClickCopyUrl(bot?.id ?? '');
                        },
                      })}
                      {...(canSwitchPinned
                        ? {
                            onClickSwitchPinned: () => {
                              bot && togglePinBot(bot);
                            },
                            isPinned: isPinnedBot(bot?.sharedStatus ?? ''),
                          }
                        : {
                            isPinned: undefined,
                            onClickSwitchPinned: undefined,
                          })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Remove the model display text */}
          {/* {getPostedModel() && (
            <div className="absolute right-2 top-10 text-xs text-dark-gray dark:text-light-gray">
              model: {getPostedModel()}
            </div>
          )} */}
        </div>
        <section className="relative size-full flex-1 overflow-auto pb-9">
          <div className="h-full">
            <div
              id="messages"
              role="presentation"
              className="flex h-full flex-col overflow-auto pb-16">
              {messages?.length === 0 ? (
                <div className="relative mb-[20vh] flex w-full flex-col items-center justify-center px-4">
                  <div className="w-full max-w-[600px] rounded-xl border border-aws-squid-ink-light/50 bg-aws-paper-light p-4 shadow-sm dark:border-aws-squid-ink-dark/50 dark:bg-aws-paper-dark">
                    <div className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      👋 Hi! I'm your SAIL AI Chat Assistant.<br/>
                      I'm here to help across Production, Personnel, Finance, Materials, Maintenance, Safety and more.<br/><br/>
                      You can ask me to:<br/>
                      • Draft notes, reports, or official letters 📝<br/>
                      • Summarise documents or policies 📄<br/>
                      • Answer technical & procedural questions ⚙️<br/>
                      • Suggest ideas & solutions for your daily tasks 💡<br/>
                      • Share safety tips & best practices 🛡️<br/><br/>
                      Just type your question — I'll do the heavy lifting.<br/>
                      Let's work smarter together! 🚀
                    </div>
                    <div className="mt-4">
                      <a 
                        href="/assets/AI Chatbot Features.pdf" 
                        download="AI Chatbot Features.pdf"
                        className="inline-block rounded-lg border-2 border-gray-400 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                      >
                        Do's and Don'ts For User
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages?.map((message, idx, array) => (
                    <div
                      key={idx}
                      className={`${
                        message.role === 'assistant'
                          ? 'bg-aws-squid-ink-light/5 dark:bg-aws-squid-ink-dark/35'
                          : ''
                      }`}>
                      <ChatMessageWithRelatedDocuments
                        chatContent={message}
                        isStreaming={postingMessage && idx + 1 === array.length}
                        onChangeMessageId={onChangeCurrentMessageId}
                        onSubmit={onSubmitEditedContent}
                        onSubmitFeedback={(messageId, feedback) => {
                          if (conversationId) {
                            giveFeedback(messageId, feedback);
                          }
                        }}
                      />
                      <div className="w-full border-b border-aws-squid-ink-light/10 dark:border-aws-squid-ink-dark/10"></div>
                    </div>
                  ))}
                  {/* Add spacing between messages and input box */}
                  <div className="pb-8 sm:pb-12"></div>
                </>
              )}
              {hasError && (
                <div className="mb-12 mt-2 flex flex-col items-center">
                  <div className="flex items-center font-bold text-red">
                    <PiWarningCircleFill className="mr-1 text-2xl" />
                    {errorDetail ?? t('error.answerResponse')}
                  </div>

                  <Button
                    className="mt-2 shadow "
                    icon={<PiArrowsCounterClockwise />}
                    outlined
                    onClick={() => {
                      retryPostChat({
                        enableReasoning: reasoningEnabled,
                        bot: inputBotParams,
                      });
                    }}>
                    {t('button.resend')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div
        className={twMerge(
          'bottom-0 z-0 flex w-full flex-col items-center justify-center px-4',
          messages.length === 0 ? 'absolute bottom-4 sm:bottom-10' : ''
        )}>
        {bot && bot.syncStatus !== SyncStatus.SUCCEEDED && (
          <div className="mb-4 sm:mb-8 w-full max-w-[600px]">
            <Alert
              severity="warning"
              title={t('bot.alert.sync.incomplete.title')}>
              {t('bot.alert.sync.incomplete.body')}
            </Alert>
          </div>
        )}
        <InputChatContent
          className="mb-4 sm:mb-7 mt-4 sm:mt-6 w-full max-w-[600px]"
          dndMode={dndMode}
          disabledSend={postingMessage || hasError}
          disabledRegenerate={postingMessage || hasError}
          disabledContinue={postingMessage || hasError}
          disabled={disabledInput}
          placeholder={
            disabledInput
              ? t('bot.label.notAvailableBotInputMessage')
              : undefined
          }
          canRegenerate={messages.length > 1}
          canContinue={getShouldContinue()}
          isLoading={postingMessage}
          isNewChat={messages.length == 0}
          onSend={onSend}
          onRegenerate={onRegenerate}
          continueGenerate={onContinueGenerate}
          ref={focusInputRef}
          supportReasoning={supportReasoning}
          reasoningEnabled={reasoningEnabled}
          onChangeReasoning={setReasoningEnabled}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Powered by Amazon Bedrock and AWS Cloud Services
        </div>
      </div>
      <BottomHelper />
    </div>
  );
};

export default ChatPage;
