import React from 'react'
import styled from 'styled-components'
import { Check } from 'react-feather'
import { Typography } from 'antd'
const {Text} = Typography;

const Wrapper = styled.div`
  border-top: 1px solid white;
  padding: 24px;
`
const Flex = styled.div`
  display: flex;
`

const Circle = styled.div<{ disabled?: boolean; isActive?: boolean }>`
  min-width: 20px;
  min-height: 20px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 8px;
  font-size: 12px;
  color: #9F9EA6
`

const CircleRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;

  &:not(:last-of-type) {
    margin-bottom: 20px;
    &::after {
      content: '';
      width: 1px;
      height: 12px;
      background: white;
      position: absolute;
      left: 10px;
      bottom: -4px;
      transform: translateY(100%);
    }
  }
`

const StepText = styled(Text)<{ disabled?: boolean; isActive?: boolean }>`
  color: white;
  font-weight: ${({ isActive }) => (isActive ? 500 : 400)};
`

interface IProgressStepperProps {
  currentStep: number
  steps: string[]
}

export function ProgressStepper({ currentStep, steps }: IProgressStepperProps) {
  if (steps.length === 0) {
    return null
  }

  return (
    <Wrapper>
      <Flex>
        {steps.map((step, i) => {
          return (
            <CircleRow key={step}>
              <Circle disabled={i > currentStep} isActive={i === currentStep}>
                {i < currentStep ? <Check size="12px" /> : i + 1}1
              </Circle>
              <StepText isActive={i === currentStep}>
                {steps[i]}
              </StepText>
            </CircleRow>
          )
        })}
      </Flex>
    </Wrapper>
  )
}
