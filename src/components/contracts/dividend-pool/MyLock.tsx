import React, { useEffect, useState } from "react";
import { providers, BigNumber, constants } from "ethers";
import {
  Card,
  Form,
  InputGroup,
  ProgressBar,
  Accordion,
} from "react-bootstrap";
import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
import { formatEther, isAddress, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, getVariantForProgressBar } from "../../../utils/utils";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../ConditionalButton";
import { ExtendedAccordionToggle } from "../../bootstrap-extend/ExtendedAccordionToggle";

export interface MyLockProps {
  index: number;
  lockId: BigNumber;
}

const MAX_LOCK_EPOCHS = 208;

export const MyLock: React.FC<MyLockProps> = ({ index, lockId }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const contracts = useWorkhardContracts();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  // form
  const [amount, setAmount] = useState<string>();
  const [delegateTo, setDelegateTo] = useState<string>();
  const [lockPeriod, setLockPeriod] = useState<number>();
  const [tokenAllowance, setTokenAllowance] = useState<BigNumber>();
  // lock
  const [lockedAmount, setLockedAmount] = useState<BigNumber>();
  const [lockedUntil, setLockedUntil] = useState<BigNumber>();
  const [lockedFrom, setLockedFrom] = useState<BigNumber>();
  const [timestamp, setTimestamp] = useState<number>();
  // lock
  const [approved, setApproved] = useState(false);
  const [delegatee, setDelegatee] = useState<string>();
  const [currentEpoch, setCurrentEpoch] = useState<BigNumber>();
  const [lastTx, setLastTx] = useState<string>();

  useEffect(() => {
    if (!!account && !!contracts) {
      contracts.veLocker.delegateeOf(lockId).then(setDelegatee);
      contracts.veLocker.locks(lockId).then((lock) => {
        setLockedAmount(lock.amount);
        setLockedUntil(lock.end);
        setLockedFrom(lock.start);
      });
    }
  }, [contracts, account, lastTx]);

  useEffect(() => {
    if (!!library && !!blockNumber) {
      library
        .getBlock(blockNumber)
        .then((block) => setTimestamp(block.timestamp));
    }
  }, [library, blockNumber]);

  const getMaxAmount = () => formatEther(tokenBalance || "0");

  const extendablePeriod = () => {
    const remaining = getTotalLockPeriod() - getLockedPeriod();
    return remaining > 0 ? remaining : 0;
  };

  const getLockedPeriod = () => {
    if (!lockedUntil) return 0;
    const locked = lockedUntil.sub(timestamp || 0).toNumber();
    return locked > 0 ? locked : 0;
  };

  const getTotalLockPeriod = () => {
    if (!lockedUntil) return 0;
    const totalLockPeriod = lockedUntil.sub(lockedFrom || 0).toNumber();
    return totalLockPeriod > 0 ? totalLockPeriod : 0;
  };

  const getLockedPercent = () => {
    return (getLockedPeriod() * 100) / getTotalLockPeriod();
  };

  const getRemainingLockPercent = () => {
    return (extendablePeriod() * 100) / getTotalLockPeriod();
  };

  const increaseAmount = () => {
    if (!!contracts && !!library && !!account) {
      if (!amount || getLockedPeriod() !== 0) {
        alert("Expired");
        return;
      }
      if (BigNumber.from(amount).lt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .increaseAmount(lockId, parseEther(amount))
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

  const extendLock = (_epochs?: number) => {
    if (!_epochs) {
      alert("Epoch is not setup");
      return;
    }
    if (!!contracts && !!library && !!account) {
      if (!amount || getLockedPeriod() !== 0) {
        alert("Expired");
        return;
      }
      if (BigNumber.from(amount).lt(tokenBalance || 0)) {
        alert("Not enough balance");
        return;
      }
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .extendLock(lockId, _epochs)
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
        .approve(contracts.dividendPool.address, constants.MaxUint256)
        .then((tx) => {
          tx.wait()
            .then((_) => {
              setTokenAllowance(constants.MaxUint256);
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

  const delegate = () => {
    if (!!contracts && !!library && !!account && !!delegateTo) {
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .delegate(lockId, delegateTo)
        .then((tx) => {
          tx.wait()
            .then((receipt) => {
              setDelegateTo("");
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
  const withdraw = () => {
    if (!!contracts && !!library && !!account) {
      const signer = library.getSigner(account);
      contracts.veLocker
        .connect(signer)
        .withdraw(lockId)
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

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      const { vision, dividendPool } = contracts;
      vision.balanceOf(account).then(setTokenBalance);
      dividendPool.getCurrentEpoch().then(setCurrentEpoch);
      vision.allowance(account, dividendPool.address).then(setTokenAllowance);
      return () => {
        stale = true;
        setTokenBalance(undefined);
        setCurrentEpoch(undefined);
      };
    }
  }, [account, contracts, lastTx, blockNumber]);

  useEffect(() => {
    if (!!account && !!contracts) {
      let stale = false;
      contracts.vision
        .allowance(account, contracts.dividendPool.address)
        .then((allowance) => {
          if (!stale) {
            setTokenAllowance(allowance);
            if (allowance.gt(amount || 0)) setApproved(true);
            else setApproved(false);
          }
        })
        .catch(() => {
          if (!stale) setTokenAllowance(undefined);
        });
    }
  }, [account, contracts, lastTx]);
  return (
    <Card>
      <Card.Header>
        <Card.Text>
          Your veVISION NFT #{index} - id: {lockId.toHexString()}
        </Card.Text>
      </Card.Header>
      <Card.Body>
        <Card.Title>You locked</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(lockedAmount || 0)}
          <span style={{ fontSize: "1rem" }}> $VISION</span>
        </Card.Text>
        <ProgressBar
          variant={getVariantForProgressBar(getLockedPercent())}
          animated
          now={getLockedPercent()}
        />
        <Card.Text>
          Locked {(getLockedPeriod() / (86400 * 365)).toFixed(2)}/ 4 years
        </Card.Text>
        <Accordion>
          <ExtendedAccordionToggle
            eventKey="1"
            as={Form.Label}
            toggled={"˄ Increase lock amount"}
            untoggled={"˅ Increase lock amount"}
          />
          <br />
          <Accordion.Collapse eventKey="1">
            <Form.Group>
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
              <Form.Text>
                You can add {formatEther(tokenBalance || 0)} $VISION to this
                lock.
              </Form.Text>
              <ConditionalButton
                whyDisabled="You staked the MAX!"
                enabledWhen={tokenBalance?.gt(0)}
                children={approved ? `Increase amount` : "approve"}
                onClick={approved ? increaseAmount : approve}
              />
            </Form.Group>
          </Accordion.Collapse>
          <ExtendedAccordionToggle
            eventKey="2"
            as={Form.Label}
            toggled={"˄ Extend lock period"}
            untoggled={"˅ Extend lock period"}
          />
          <br />
          <Accordion.Collapse eventKey="2">
            <Form.Group>
              <Form.Control
                placeholder={`min: ${1} epoch(s) ~= 1 week / max: 208 epoch(s) ~= 4 years`}
                type="range"
                min={1}
                max={MAX_LOCK_EPOCHS - getLockedPeriod()}
                value={lockPeriod}
                step={1}
                onChange={({ target: { value } }) =>
                  setLockPeriod(parseInt(value))
                }
              />
              <Form.Text>
                You can extend {lockPeriod || "0"} weeks /{" "}
                {extendablePeriod() / (86400 * 7)} weeks
              </Form.Text>
              <ConditionalButton
                whyDisabled="You locked the MAX!"
                enabledWhen={extendablePeriod() !== 0}
                children="Extend lock"
                onClick={() => extendLock(lockPeriod)}
              />
            </Form.Group>
          </Accordion.Collapse>
          <ExtendedAccordionToggle
            eventKey="3"
            as={Form.Label}
            toggled={"˄ Delegate votes"}
            untoggled={"˅ Delegate votes"}
          />
          <br />
          <Accordion.Collapse eventKey="3">
            <Form.Group>
              <Form.Control
                placeholder="0xABCDEF0123456789ABCDEF0123456789ABCDEF"
                value={delegateTo}
                onChange={(event) => setDelegateTo(event.target.value)}
              />
              <Form.Text>
                {delegatee} is exercising your voting rights.
              </Form.Text>
              <ConditionalButton
                onClick={delegate}
                enabledWhen={isAddress(delegateTo || "")}
                whyDisabled={`Not a valid address`}
                children={`Delegate your votes`}
              />
            </Form.Group>
          </Accordion.Collapse>
          <ExtendedAccordionToggle
            eventKey="4"
            as={Form.Label}
            toggled={"˄ Withdraw"}
            untoggled={"˅ Withdraw"}
          />
          <br />
          <Accordion.Collapse eventKey="4">
            <ConditionalButton
              whyDisabled="Still locked"
              enabledWhen={getLockedPeriod() === 0}
              children="Withdraw"
              onClick={withdraw}
            />
          </Accordion.Collapse>
        </Accordion>{" "}
      </Card.Body>
    </Card>
  );
};