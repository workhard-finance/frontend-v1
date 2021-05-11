import { Button, Card, ProgressBar } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import { useWeb3React } from "@web3-react/core";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { BigNumber, providers, Signer } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { DecodedTxData, decodeTxDetails } from "../../../utils/utils";
import { DecodedTxs } from "../../DecodedTxs";
import { ConditionalButton } from "../../ConditionalButton";

interface Proposal {
  proposer: string;
  start: BigNumber;
  end: BigNumber;
  totalForVotes: BigNumber;
  totalAgainstVotes: BigNumber;
}

export interface ProposedTx {
  txHash: string;
  target: string | string[];
  value: BigNumber | BigNumber[];
  data: string | string[];
  predecessor: string;
  salt: string;
  start: BigNumber;
  end: BigNumber;
}

export enum VoteForTxStatus {
  Pending,
  Voting,
  Ended,
}

export interface VoteForTxProps {
  tx: ProposedTx;
  status: VoteForTxStatus;
  myVotes?: BigNumber;
}

enum TxState {
  NOT_SCHEDULED = "Not scheduled",
  PENDING = "Pending",
  READY = "Ready",
  DONE = "Executed",
}

export const VoteForTx: React.FC<VoteForTxProps> = ({
  myVotes,
  tx,
  status,
}) => {
  const { account, library, chainId } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [proposal, setProposal] = useState<Proposal>();
  const [scheduledTimestamp, setScheduledTimestamp] = useState<BigNumber>();
  const [txState, setTxState] = useState<TxState>();
  const [lastTx, setLastTx] = useState<string>();
  const [decodedTxData, setDecodedTxData] = useState<DecodedTxData[]>();

  useEffect(() => {
    if (!contracts || !library || !blockNumber) {
      return;
    }
    const { workersUnion, timelockedGovernance } = contracts;
    workersUnion.callStatic.proposals(tx.txHash).then(setProposal);
    timelockedGovernance.callStatic
      .getTimestamp(tx.txHash)
      .then(setScheduledTimestamp);
  }, [contracts]);

  useEffect(() => {
    if (!contracts || !library || !blockNumber || !scheduledTimestamp) {
      return;
    }
    if (scheduledTimestamp.eq(0)) {
      setTxState(TxState.NOT_SCHEDULED);
    } else if (scheduledTimestamp.eq(1)) {
      setTxState(TxState.DONE);
    } else {
      library.getBlock(blockNumber).then((block) => {
        if (scheduledTimestamp.gt(block.timestamp)) {
          setTxState(TxState.PENDING);
        } else {
          setTxState(TxState.READY);
        }
      });
    }
  }, [contracts, blockNumber]);

  useEffect(() => {
    if (!contracts || !proposal) {
      return;
    }
    const { target, data, value } = tx;
    if (Array.isArray(target) && Array.isArray(data) && Array.isArray(value)) {
      setDecodedTxData(
        target.reduce(
          (arr, _target, i) => [
            ...arr,
            decodeTxDetails(contracts, _target, data[i], value[i]),
          ],
          [] as DecodedTxData[]
        )
      );
    } else if (
      !Array.isArray(target) &&
      !Array.isArray(data) &&
      !Array.isArray(value)
    ) {
      setDecodedTxData([decodeTxDetails(contracts, target, data, value)]);
    }
  }, [contracts, proposal]);

  const onVote = (agree: boolean) => async () => {
    if (!contracts || !library || !account) {
      return;
    }
    const workersUnion = contracts.workersUnion;
    const signer = await library.getSigner(account);
    await workersUnion.connect(signer).vote(tx.txHash, agree);
  };

  const schedule = () => {
    if (!contracts || !library || !account) {
      return;
    }
    const workersUnion = contracts.workersUnion;
    const signer: Signer = library.getSigner(account);
    if (
      !Array.isArray(tx.target) &&
      !Array.isArray(tx.value) &&
      !Array.isArray(tx.data)
    ) {
      workersUnion
        .connect(signer)
        .schedule(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else if (
      Array.isArray(tx.target) &&
      Array.isArray(tx.value) &&
      Array.isArray(tx.data)
    ) {
      workersUnion
        .connect(signer)
        .scheduleBatch(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else {
      throw Error("unexpected type");
    }
  };

  const execute = () => {
    if (!contracts || !library || !account) {
      return;
    }
    const workersUnion = contracts.workersUnion;
    const signer: Signer = library.getSigner(account);
    if (
      !Array.isArray(tx.target) &&
      !Array.isArray(tx.value) &&
      !Array.isArray(tx.data)
    ) {
      workersUnion
        .connect(signer)
        .execute(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else if (
      Array.isArray(tx.target) &&
      Array.isArray(tx.value) &&
      Array.isArray(tx.data)
    ) {
      workersUnion
        .connect(signer)
        .executeBatch(tx.target, tx.value, tx.data, tx.predecessor, tx.salt)
        .then((res) => {
          res.wait().then((receipt) => setLastTx(receipt.transactionHash));
        });
    } else {
      throw Error("unexpected type");
    }
  };
  return (
    <Card>
      <Card.Header as="h5">propose: {tx.txHash}</Card.Header>
      <Card.Body>
        <Card.Text>Schedule:</Card.Text>
        <ul>
          <li>
            Voting period:{" "}
            {new Date(tx.start.mul(1000).toNumber()).toLocaleString()}
            {" ~ "}
            {new Date(tx.end.mul(1000).toNumber()).toLocaleString()}
          </li>
          <li>executed: {txState}</li>
        </ul>
        <Card.Text>Transaction:</Card.Text>
        {decodedTxData && <DecodedTxs txs={decodedTxData} values={tx.value} />}
        <br />
        <Card.Text>Voting power:</Card.Text>
        <Card.Text style={{ fontSize: "3rem" }}>
          {votesInGwei(myVotes)}
          <span style={{ fontSize: "1rem" }}> votes</span>
        </Card.Text>
        {status === VoteForTxStatus.Voting && (
          <>
            <Card.Text>Voting</Card.Text>
            <ProgressBar>
              <ProgressBar
                animated
                variant="success"
                now={frac(
                  proposal?.totalForVotes,
                  proposal?.totalForVotes.add(proposal?.totalAgainstVotes || 0)
                )}
                key={1}
              />
              <ProgressBar
                animated
                variant="danger"
                now={frac(
                  proposal?.totalAgainstVotes,
                  proposal?.totalForVotes.add(proposal?.totalAgainstVotes || 0)
                )}
                key={2}
              />
            </ProgressBar>
            <Card.Text>
              {votesInGwei(proposal?.totalForVotes)} votes for /{" "}
              {votesInGwei(proposal?.totalAgainstVotes)} votes against
            </Card.Text>
            <br />
            <Button variant="success" onClick={onVote(true)}>
              For
            </Button>{" "}
            <Button variant="danger" onClick={onVote(false)}>
              Against
            </Button>
          </>
        )}
        {status === VoteForTxStatus.Ended && (
          <>
            <ConditionalButton
              variant="primary"
              enabledWhen={
                txState === TxState.NOT_SCHEDULED &&
                proposal?.totalForVotes.gt(proposal?.totalAgainstVotes || 0)
              }
              onClick={schedule}
              whyDisabled={
                txState === TxState.NOT_SCHEDULED
                  ? "Proposal is not passed"
                  : "Already scheduled"
              }
              children={"Schedule"}
            />{" "}
            <ConditionalButton
              variant="secondary"
              enabledWhen={
                txState === TxState.READY &&
                proposal?.totalForVotes.gt(proposal?.totalAgainstVotes || 0)
              }
              onClick={execute}
              whyDisabled={
                txState === TxState.DONE ? "Already executed" : "Pending."
              }
              children={"Execute"}
            />
          </>
        )}
      </Card.Body>
    </Card>
  );

  function frac(a?: BigNumber, b?: BigNumber): number {
    if (!a || !b) {
      return 0;
    } else if (b.eq(0)) {
      return 0;
    } else {
      return a.mul(100).div(b).toNumber();
    }
  }
};

const votesInGwei = (vote?: BigNumber): string => {
  return parseFloat(formatUnits(vote || 0, "gwei")).toFixed(2);
};