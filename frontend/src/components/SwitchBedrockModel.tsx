import { BaseProps } from '../@types/common';
import useModel from '../hooks/useModel';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react/jsx-runtime';
import { useMemo } from 'react';
import { PiCaretDown, PiCheck } from 'react-icons/pi';
import { ActiveModels } from '../@types/bot';
import { toCamelCase } from '../utils/StringUtils';

interface Props extends BaseProps {
  activeModels: ActiveModels;
  botId?: string | null;
}

const SwitchBedrockModel: React.FC<Props> = (props) => {
  const {
    availableModels: allModels,
    modelId,
    setModelId,
  } = useModel(props.botId, props.activeModels);

  const availableModels = useMemo(() => {
    return allModels.filter((model) => {
      if (props.activeModels) {
        return (
          props.activeModels[
            toCamelCase(model.modelId) as keyof ActiveModels
          ] === true
        );
      }
      return true;
    });
  }, [allModels, props.activeModels]);

  const modelName = useMemo(() => {
    const model = availableModels.find((model) => model.modelId === modelId);
    if (model?.modelId === 'claude-v4-sonnet') {
      return 'Claude 4 (Sonnet)';
    }
    return model?.label ?? '';
  }, [availableModels, modelId]);

  return (
    <div className="relative">
      <Popover className="relative">
        {() => (
          <>
            <Popover.Button
              className={`${
                props.className ?? ''
              } group inline-flex items-center justify-center rounded-md border border-aws-squid-ink-light/50 dark:border-aws-squid-ink-dark/50 bg-aws-paper-light dark:bg-aws-paper-dark p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
            >
              {/* Show only icon on mobile, full text on desktop */}
              <div className="block sm:hidden">
                <PiCaretDown className="h-5 w-5 text-dark-gray dark:text-light-gray" />
              </div>
              <div className="hidden sm:flex items-center justify-between text-base font-medium text-dark-gray dark:text-light-gray">
                <span className="mr-2">{modelName}</span>
                <PiCaretDown className="h-5 w-5" />
              </div>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1">
              <Popover.Panel className="absolute right-0 top-full mt-1 z-50 min-w-[200px] sm:w-96">
                <div className="overflow-hidden rounded-md shadow-lg">
                  <div className="flex flex-col rounded border border-aws-font-color-light/50 dark:border-aws-font-color-dark/50 bg-white dark:bg-aws-ui-color-dark text-xs sm:text-sm max-h-60 sm:max-h-80 overflow-y-auto">
                    {availableModels.map((model) => (
                      <div
                        key={model.modelId}
                        className={`m-1 flex rounded p-1 px-2 ${
                          model.modelId === 'claude-v4-sonnet'
                            ? 'cursor-pointer hover:bg-light-gray dark:hover:bg-aws-paper-dark'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => {
                          if (model.modelId === 'claude-v4-sonnet') {
                            setModelId(model.modelId);
                          }
                        }}>
                        <div className="mr-3 flex flex-col items-center justify-center">
                          <PiCheck
                            className={
                              model.modelId === modelId
                                ? ''
                                : 'text-transparent'
                            }
                          />
                        </div>
                        <div>
                          <div className="block text-left font-semibold">
                            <span>{model.label}</span>
                          </div>
                          {model.description && (
                            <div className="block whitespace-normal text-left text-xs text-dark-gray dark:text-aws-font-color-dark">
                              <span>{model.description}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

export default SwitchBedrockModel;
