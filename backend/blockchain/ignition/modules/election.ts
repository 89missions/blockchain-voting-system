import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ElectionModule = buildModule("ElectionModule", (m) => {
  const election = m.contract("Election");

  return { election };
});

export default ElectionModule;