import React, { useEffect, useState } from "react";
import Page from "../layouts/Page";
import {
  Button,
  Card,
  Form,
  FormControl,
  Image,
  InputGroup,
  OverlayTrigger,
  Tab,
  Tabs,
  Tooltip,
} from "react-bootstrap";
import { useWorkhardContracts } from "../providers/WorkhardContractProvider";
import { BigNumber } from "ethers";
import { ProjectBox } from "../components/contracts/project/ProjectBox";
import { PostAJobBox } from "../components/contracts/crypto-job-board/PostAJob";
import { BuyCommitment } from "../components/contracts/commitment-fund/BuyCommitment";

const Work: React.FC = () => {
  const contracts = useWorkhardContracts();
  // const { account, library, chainId } = useWeb3React();

  const [activeProjects, setActiveProjects] = useState<string[]>(
    [] as string[]
  );
  const [inactiveProjects, setInactiveProjects] = useState<string[]>(
    [] as string[]
  );

  // TODO listen CryptoJobBoard events and add dependency to useEffect()

  useEffect(() => {
    if (!!contracts) {
      let stale = false;
      const { project, cryptoJobBoard } = contracts;
      project
        .totalSupply()
        .then((n: BigNumber) => {
          if (!stale) {
            Array(n.toNumber())
              .fill(undefined)
              .map((_, i) => i.toString())
              .forEach((projId) => {
                cryptoJobBoard.approvedProjects(projId).then((approved) => {
                  if (approved) {
                    activeProjects.push(projId);
                    setActiveProjects([...new Set(activeProjects)]);
                  } else {
                    inactiveProjects.push(projId);
                    setInactiveProjects([...new Set(inactiveProjects)]);
                  }
                });
              });
          }
        })
        .catch(() => {
          if (!stale) {
            setActiveProjects([]);
            setInactiveProjects([]);
          }
        });

      return () => {
        stale = true;
        setActiveProjects([]);
        setInactiveProjects([]);
      };
    }
  }, [contracts]); // ensures refresh if referential identity of library doesn't change across chainIds
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/work.jpg"}
        style={{
          width: "100%",
          padding: "0px",
          borderWidth: "5px",
        }}
      />
      <blockquote className="blockquote" style={{ textAlign: "right" }}>
        <p className="mb-0">
          All men must work, even the rich, because to work was the will of God
        </p>
        {/* <footer className="blockquote-footer">John Calvin</footer> */}
      </blockquote>
      {/* <Alert variant={"warning"}>
        All men must work, even the rich, because to work was the will of God
      </Alert> */}
      <hr />
      <h1>Crypto Job Board</h1>
      <p>Work for projects and earn $COMMITMENT tokens.</p>
      <Tabs
        defaultActiveKey="activeProjects"
        id="uncontrolled-tab-example"
      >
        <Tab
          eventKey="activeProjects"
          title="Active projects"
          style={{ marginTop: "1rem" }}
        >
          {activeProjects.map((id) => (
            <>
              <ProjectBox projId={id} />
              <br />
            </>
          ))}
        </Tab>
        <Tab
          eventKey="inactiveProjects"
          title="Inactive/pending projects"
          style={{ marginTop: "1rem" }}
        >
          {inactiveProjects.map((id) => (
            <>
              <ProjectBox projId={id} />
              <br />
            </>
          ))}
        </Tab>
        <Tab eventKey="post" title="Post a job" style={{ marginTop: "1rem" }}>
          <PostAJobBox />
        </Tab>
        <Tab
          eventKey="buy"
          title="Buy $COMMITMENT"
          style={{ marginTop: "1rem" }}
        >
          <BuyCommitment/>
        </Tab>
      </Tabs>
    </Page>
  );
};

export default Work;
