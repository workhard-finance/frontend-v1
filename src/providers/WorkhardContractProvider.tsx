import React from "react";
import { useWeb3React } from "@web3-react/core";
import { useContext } from "react";
import {
  // deployed,
  Deployed,
  getNetworkName,
} from "@workhard/protocol/dist/deployed";
import devDeploy from "@workhard/protocol/deployed.dev.json";
import {
  BurnMining,
  BurnMining__factory,
  CommitmentFund,
  CommitmentFund__factory,
  FarmersUnion,
  FarmersUnion__factory,
  Project,
  CryptoJobBoard,
  CryptoJobBoard__factory,
  Project__factory,
  StakeMining,
  StakeMining__factory,
  VisionFarm,
  VisionFarm__factory,
  VisionTokenEmitter,
  VisionTokenEmitter__factory,
  TimelockedGovernance,
  TimelockedGovernance__factory,
} from "@workhard/protocol";

// let deployedContracts: Deployed = deployed;
// if (process.env.REACT_APP_DEV_MODE) {
//   deployedContracts = devDeploy;
// }

let deployedContracts: Deployed = devDeploy;

export interface WorkhardContracts {
  project: Project;
  cryptoJobBoard: CryptoJobBoard;
  commitmentFund: CommitmentFund;
  visionFarm: VisionFarm;
  liquidityMining: StakeMining;
  commitmentMining: BurnMining;
  visionTokenEmitter: VisionTokenEmitter;
  farmersUnion: FarmersUnion;
  timeLockGovernance: TimelockedGovernance;
}

export const WorkhardContractCtx = React.createContext<WorkhardContracts | undefined>(
  undefined
);

export function useWorkhardContracts() {
  const contracts = useContext(WorkhardContractCtx);
  return contracts;
}

export const WorkhardContractsProvider = ({ children }: { children: any }) => {
  const { active, library, chainId } = useWeb3React();
  const getContext = () => {
    if (!active) return undefined;
    if (!library) return undefined;
    if (!chainId) return undefined;
    const contracts = deployedContracts[getNetworkName(chainId)];
    if (
      !contracts ||
      !contracts.Project ||
      !contracts.CryptoJobBoard ||
      !contracts.CommitmentFund ||
      !contracts.VisionFarm ||
      !contracts.LiquidityMining ||
      !contracts.CommitmentMining ||
      !contracts.FarmersUnion ||
      !contracts.VisionTokenEmitter ||
      !contracts.TimelockedGovernance
    ) {
      return undefined;
    }

    const project = Project__factory.connect(contracts.Project, library);
    const cryptoJobBoard = CryptoJobBoard__factory.connect(
      contracts.CryptoJobBoard,
      library
    );
    const commitmentFund = CommitmentFund__factory.connect(
      contracts.CommitmentFund,
      library
    );
    const visionFarm = VisionFarm__factory.connect(
      contracts.VisionFarm,
      library
    );
    const liquidityMining = StakeMining__factory.connect(
      contracts.LiquidityMining,
      library
    );
    const commitmentMining = BurnMining__factory.connect(
      contracts.CommitmentMining,
      library
    );
    const visionTokenEmitter = VisionTokenEmitter__factory.connect(
      contracts.VisionTokenEmitter,
      library
    );
    const farmersUnion = FarmersUnion__factory.connect(
      contracts.FarmersUnion,
      library
    );
    const timeLockGovernance = TimelockedGovernance__factory.connect(
        contracts.TimelockedGovernance,
        library
    )
    const context: WorkhardContracts = {
      project,
      cryptoJobBoard,
      visionFarm,
      liquidityMining,
      commitmentMining,
      visionTokenEmitter,
      commitmentFund,
      farmersUnion,
      timeLockGovernance
    };
    return context;
  };
  const context = getContext()

  return (
    <WorkhardContractCtx.Provider value={context}>
      {children}
    </WorkhardContractCtx.Provider>
  );
};
