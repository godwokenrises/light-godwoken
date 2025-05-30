import React from "react";
import styled from "styled-components";
import { Icon } from "@ricons/utils";
import { OpenInNewRound } from "@ricons/material";
import { ShowOnPhaseOut } from "./ShowOnPhaseOut";
import { Card } from "../../style/common";

const Wrapper = styled.div`
  padding: 0 16px;

  .fade-out-card {
    margin-bottom: -36px;
    padding: 20px 20px 60px 20px;
    border-radius: 24px 24px 0 0;
    background-color: #1d785e;
  }

  .title {
    text-transform: uppercase;
    margin-bottom: 12px;
    font-weight: 800;
    font-size: 18px;
    color: #ffffff;
  }

  .description {
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 14px;
    color: #eaeaea;

    p {
      margin-bottom: 4px;

      a {
        text-decoration: underline;
        text-decoration-color: #e8e8e8;
      }
    }

    b {
      color: #ffffff;
    }
  }

  .link {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(0, 0, 0, 0.4);
    transition: all 0.1s;
    border-radius: 16px;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
      text-decoration-color: #e8e8e8;
      background-color: rgba(0, 0, 0, 0.5);
    }

    .link-title {
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
    }

    .link-href {
      color: #dfdddd;
      font-size: 12px;
    }

    .icon {
      display: flex;
      align-items: center;
      margin-left: 4px;
      font-size: 16px;
      color: #dfdddd;
    }
  }
`;

export function PhaseOutCard() {
  return (
    <ShowOnPhaseOut
      is={
        <Wrapper>
          <Card className="fade-out-card">
            <div className="title">Godwoken Phase-out</div>
            <div className="description">
              <p>
                To align with the evolving landscape of the CKB ecosystem, we are sunsetting{" "}
                <a href="https://forcebridge.com/" target="_blank">
                  <b>Force Bridge</b>
                </a>{" "}
                and{" "}
                <a href="https://www.godwoken.com/" target="_blank">
                  <b>Godwoken</b>
                </a>
                .
              </p>
              <p>
                During this period, all deposit pipelines are paused on Godwoken Bridge. Please withdraw all assets to
                CKB before <b>October 31 2025</b>.
              </p>
            </div>
            <a href="https://sunset.forcebridge.com/" target="_blank">
              <div className="link">
                <div>
                  <div className="link-title">End of an Era: Force Bridge Sunset</div>
                  <div className="link-href">https://sunset.forcebridge.com</div>
                </div>
                <div className="icon">
                  <Icon>
                    <OpenInNewRound />
                  </Icon>
                </div>
              </div>
            </a>
          </Card>
        </Wrapper>
      }
    />
  );
}
