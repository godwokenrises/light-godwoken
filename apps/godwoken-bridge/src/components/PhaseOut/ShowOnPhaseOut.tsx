import React, { ReactNode } from "react";

export const ShowOnPhaseOut: React.FC<{
  is?: ReactNode;
  not?: ReactNode;
}> = (props: { is?: ReactNode; not?: ReactNode }) => {
  if (!props.is && !props.not) {
    throw new Error('Either "is" or "not" prop must be provided');
  }
  return process.env.REACT_APP_PHASE_OUT === "true"
    ? ((props.is ?? null) as JSX.Element)
    : ((props.not ?? null) as JSX.Element);
};
