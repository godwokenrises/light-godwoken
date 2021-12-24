import React from 'react'
import styled from 'styled-components'
import PageHeader from './PageHeader'

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: calc(100vh);
  background: radial-gradient(89.56% 89.56% at 50.04% 10.44%, rgb(60, 58, 75) 0%, rgb(28, 27, 37) 92.56%);
`

const Page: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  return (
    <StyledPage {...props}>
      <PageHeader></PageHeader>
      {children}
    </StyledPage>
  )
}

export default Page
