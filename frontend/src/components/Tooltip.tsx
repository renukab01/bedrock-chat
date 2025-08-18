import React from 'react';
import { BaseProps } from '../@types/common';
import { Direction, TooltipDirection } from '../constants';

type Props = BaseProps & {
  message: string;
  direction?: Direction;
  children: React.ReactNode;
};

const Tooltip: React.FC<Props> = (props) => {
  return (
    <div className={`${props.className ?? ''} group relative inline-block dark:text-aws-font-color-dark`}>
      <div
        className={`invisible absolute mt-2 transform bg-transparent text-xs font-normal text-black dark:text-white opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100`}
        style={{ top: '100%', whiteSpace: 'nowrap', left: '-120px' }}>
<div className="inline-block rounded-xl border-2 border-gray-400 bg-white dark:bg-aws-paper-dark px-4 py-2">
          {props.message}
        </div>
      </div>
      {props.children}
    </div>
  );
};

export default Tooltip;
