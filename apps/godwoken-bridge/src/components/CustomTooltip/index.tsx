import React from "react";
import { Tooltip, TooltipProps } from "antd";

export const CustomTooltip: React.FC<TooltipProps> = (props) => {
  return (
    <Tooltip
      // Set z-index lower than modal
      zIndex={props.zIndex ?? 999}
      {...props}
    />
  );
};
