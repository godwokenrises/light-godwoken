import React from "react";
import styled from "styled-components";
import { ReactComponent as Logo } from "../../assets/logo.svg";
import { Card } from "../../style/common";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: calc(100vh);
  background: linear-gradient(111.44deg, #dcf2ed 0%, #d3d9ec 100%);

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 64px;
    background-color: #ffffff;
  }

  .body {
    padding: 0 16px;
    margin: 24px auto 16px auto;

    p {
      margin: 0;
    }
    p + p {
      margin-top: 12px;
    }
  }
`;

export function PageSuspended() {
  return (
    <Wrapper>
      <div className="header">
        <div className="logo-container">
          <Logo height={27} />
        </div>
      </div>
      <div className="body">
        <Card>
          <p>
            At the request of the Force Bridge Team, and in light of the recent incident affecting <b>Force Bridge</b>,
            the <b>Godwoken Bridge</b> service will also be temporarily suspended.{" "}
          </p>
          <p>
            Services will resume once the situation has been fully assessed and clarified. Updates will be shared as the
            situation progresses. We appreciate your patience and understanding.
          </p>
        </Card>
      </div>
    </Wrapper>
  );
}
