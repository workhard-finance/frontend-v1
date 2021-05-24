import React, { useState } from "react";
import Page from "../../layouts/Page";

import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Accordion,
  Container,
} from "react-bootstrap";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber, ContractTransaction } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { parseEther } from "ethers/lib/utils";
import { Link, useHistory, useParams } from "react-router-dom";
import { ConditionalButton } from "../../components/ConditionalButton";
import { useIPFS } from "../../providers/IPFSProvider";
import { permaPinToArweave } from "../../utils/utils";
import { DAOThumbnail } from "../../components/contracts/workhard/DAOThumbnail";
import { CreateProject } from "../../components/contracts/workhard/CreateProject";
import { LaunchDAO } from "../../components/contracts/workhard/LaunchDAO";
import { UpgradeToDAO } from "../../components/contracts/workhard/UpgradeToDAO";
// import { UpgradeToDAO } from "../../components/contracts/workhard/UpgradeToDAO";

export const ForkAndLaunch: React.FC = () => {
  const { account, library } = useWeb3React();
  const history = useHistory();
  const { dao } = useWorkhard() || {};
  const { ipfs } = useIPFS();
  const { step, projId } = useParams<{ step: string; projId?: string }>();

  const [name, setName] = useState<string>();
  const [symbol, setSymbol] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [file, setFile] = useState<File>();
  const [imageURI, setImageURI] = useState<string>();
  const [imageArweaveId, setImageArweaveId] = useState<string>();
  const [metadataURI, setMetadataURI] = useState<string>();
  const [metadataArweaveId, setMetadataArweaveId] = useState<string>();
  const [price, setPrice] = useState<number>(100);
  const [profitRate, setProfitRate] = useState<number>(0);
  const [maxSupply, setMaxSupply] = useState<number>(10);
  const [limitedEdition, setLimitedEdition] = useState<boolean>(false);
  const [uploaded, setUploaded] = useState<boolean>();
  const [uploading, setUploading] = useState<boolean>();
  const [launchTx, setLaunchTx] = useState<ContractTransaction>();
  const [previewURL, setPreviewURL] = useState<string>();

  return (
    <Page>
      <Row>
        <Col md={8}>
          <h1>
            Start <b>DAO</b> with <b>Commit Mining</b>
          </h1>
        </Col>
        <Col md={{ span: 4 }} style={{ textAlign: "end" }}>
          <Button
            variant="outline-primary"
            onClick={() => history.goBack()}
            children={"Go back"}
          />
        </Col>
      </Row>
      <hr />
      <Row>
        <Col>
          <Accordion activeKey={step}>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Container}
                  eventKey={"new"}
                  className={step === "new" ? "text-primary" : "text-muted"}
                >
                  Step 1. Create a project.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={"new"} appear={true}>
                <Card.Body>
                  <p>
                    Do you already have a project?{" "}
                    <Link to={`/work/job`}>Go to project menu</Link> and click
                    upgrade! Or create a new one here!
                  </p>
                  <CreateProject
                    onCreated={(id) =>
                      history.push(`/fork/upgrade/${id.toNumber()}`)
                    }
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Container}
                  eventKey={"upgrade"}
                  className={step === "upgrade" ? "text-primary" : "text-muted"}
                >
                  Step2. Upgrade it to a DAO.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`upgrade`}>
                <Card.Body>
                  <UpgradeToDAO
                    id={projId}
                    onUpgraded={() => history.push(`/fork/launch/${projId}`)}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
            <Card>
              <Card.Header>
                <Accordion.Toggle
                  as={Container}
                  eventKey={`launch`}
                  className={step === "launch" ? "text-primary" : "text-muted"}
                >
                  Step3. Setup emission and launch.
                </Accordion.Toggle>
              </Card.Header>
              <Accordion.Collapse eventKey={`launch`}>
                <Card.Body>
                  <LaunchDAO
                    id={projId}
                    onLaunched={() => history.push(`/fork`)}
                  />
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </Col>
        <Col md={4}>
          <h4>
            <b>Guide</b>
          </h4>
          <p>Do you want to do some test on Rinkeby first?</p>
          <Link to={"/res"}>Go to Rinkeby Workhard</Link>
          {step === "new" || <p></p>}
        </Col>
      </Row>
    </Page>
  );
};
