import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import { Card, Button, Form, InputGroup, ProgressBar } from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { getVariantForProgressBar } from "../../../utils/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";

export interface CreateLockProps {
  stakedAmount?: BigNumber;
}

const MAX_LOCK_EPOCHS = 208;

export const CreateLock: React.FC<CreateLockProps> = ({ stakedAmount }) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [approved, setApproved] = useState(false);
  const [amount, setAmount] = useState<string>();
  const [lockPeriod, setLockPeriod] = useState<number>(1);
  const [lastTx, setLastTx] = useState<string>();

  const getMaxAmount = () => formatEther(tokenBalance || "0");

  const getStakePercent = () => {
    if (!stakedAmount) return 0;
    const total = stakedAmount.add(tokenBalance || 0);
    if (total.eq(0)) return 0;
    return stakedAmount.mul(100).div(total).toNumber();
  };

  const createLock = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount || !lockPeriod) return;
      const amountInWei = parseEther(amount);
      if (amountInWei.lt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .createLock(amountInWei, lockPeriod || 0)
        .then((tx) => {
          tx.wait()
            .then((receipt) => {
              setLastTx(receipt.transactionHash);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {});
      return;
    } else {
      alert("Not connected");
    }
  };
  const approve = () => {
    if (!!contracts && !!library && !!account) {
      const signer = library.getSigner(account);
      contracts.vision
        .connect(signer)
        .approve(contracts.veLocker.address, constants.MaxUint256)
        .then((tx) => {
          tx.wait()
            .then((_) => {
              setApproved(true);
            })
            .catch((rejected) => alert(`Rejected with ${rejected}`));
        })
        .catch(() => {
          setApproved(false);
        });
      return;
    } else {
      alert("Not connected");
    }
  };

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { vision, veLocker } = contracts;
      vision.balanceOf(account).then(setTokenBalance);
      vision.allowance(account, veLocker.address).then((allowance) => {
        if (allowance.gt(parseEther(amount || "0"))) setApproved(true);
        else setApproved(false);
      });
      return () => {
        stale = true;
        setTokenBalance(undefined);
      };
    }
  }, [account, contracts, lastTx, blockNumber]);

  return (
    <Card>
      <Card.Body>
        <Card.Title>Create a new lock</Card.Title>
        <Form>
          <Form.Group>
            <Form.Label>Stake amount</Form.Label>
            <InputGroup className="mb-2">
              <Form.Control
                value={amount}
                onChange={({ target: { value } }) => setAmount(value)}
                placeholder={getMaxAmount()}
              />
              <InputGroup.Append
                style={{ cursor: "pointer" }}
                onClick={() => setAmount(getMaxAmount())}
              >
                <InputGroup.Text>MAX</InputGroup.Text>
              </InputGroup.Append>
            </InputGroup>
            <ProgressBar
              variant={getVariantForProgressBar(getStakePercent())}
              animated
              now={getStakePercent()}
            />
            <Form.Text>
              {formatEther(stakedAmount || 0)} /{" "}
              {formatEther(
                (tokenBalance || BigNumber.from(0)).add(stakedAmount || 0)
              )}{" "}
              of your $VISION token is staked.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Lock period</Form.Label>
            <Form.Control
              placeholder={`min: ${1} epoch(s) ~= 1 week / max: 208 epoch(s) ~= 4 years`}
              type="range"
              min={1}
              max={MAX_LOCK_EPOCHS}
              value={lockPeriod}
              step={1}
              onChange={({ target: { value } }) =>
                setLockPeriod(parseInt(value))
              }
            />
            <Form.Text>
              {lockPeriod} weeks({(lockPeriod / 52).toFixed(1)} years) / 4 years
            </Form.Text>
          </Form.Group>
          <Button variant="primary" onClick={approved ? createLock : approve}>
            {approved
              ? `Stake and lock ` + (lockPeriod ? `${lockPeriod} epoch(s)` : ``)
              : "approve"}
          </Button>{" "}
        </Form>
      </Card.Body>
    </Card>
  );
};