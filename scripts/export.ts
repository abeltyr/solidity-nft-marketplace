import dotenv from "dotenv";
import path from "path";
import fs from "fs-extra";

dotenv.config();

if (!process.env.WORKSPACE_FILE) {
  throw new Error("WORKSPACE_FILE environment variable not set.");
}

interface Workspace {
  projects: {
    [key: string]: {
      path: string;
    };
  };
}

interface Project {
  name: string;
  paths: {
    contracts: string;
  };
}

const projects: Project[] = [
  {
    name: "nft-marketplace",
    paths: {
      contracts: "contracts",
    },
  },
  {
    name: "admin-dashboard",
    paths: {
      contracts: "contracts",
    },
  },
  {
    name: "api",
    paths: {
      contracts: "src/contracts",
    },
  },
];

const config = {
  paths: {
    typechain: "typechain",
    abis: "abis",
  },
};

const workspace: Workspace = require(process.env.WORKSPACE_FILE);

function distribute(projects: Project[]) {
  for (const project of projects) {
    distributeToProject(project);
  }
}

function distributeToProject(project: Project) {
  const projectPath = workspace.projects[project.name].path;
  const contractPath = project.paths.contracts;
  const typechainPath = config.paths.typechain;
  const abisPath = config.paths.abis;

  copyTypechain(path.resolve(projectPath, contractPath, typechainPath));
  copyAbis(path.resolve(projectPath, contractPath, abisPath));
}

function copyTypechain(dest: string) {
  fs.ensureDirSync(dest);
  fs.copySync("typechain", dest);
  console.log(`typechain copied to ${dest}`);
}

function copyAbis(dest: string) {
  const contractsPath = "artifacts/contracts";
  function getContractNames() {
    const entries = fs.readdirSync(contractsPath);
    return entries
      .filter(
        (entry) =>
          fs.lstatSync(path.resolve(contractsPath, entry)).isDirectory() &&
          entry.endsWith(".sol")
      )
      .map((entry) => entry.slice(0, -4));
  }

  function getAbi(contractName: string) {
    const contractPath = path.resolve(
      contractsPath,
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(contractPath)) {
      return;
    }

    const contract = fs.readJSONSync(contractPath);
    return contract.abi;
  }

  const contractNames = getContractNames();
  for (const contractName of contractNames) {
    const abi = getAbi(contractName);
    if (!abi) {
      continue;
    }
    fs.ensureDirSync(dest);
    fs.writeJSONSync(path.resolve(dest, `${contractName}.json`), abi);
  }

  console.log(`abis copied to ${dest}`);
}

function main() {
  distribute(projects);
}

main();
