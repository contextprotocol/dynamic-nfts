import { parseEther } from "ethers";
import { loadConf, getContext, getBlockchain} from "./utils";
import { title, spinStart, spinStop, log } from "./utils/console";

/**
 * MAIN
 */
async function main() {
    
  // Load Configuration from /data/conf.json
  const confData = await loadConf();

  // Get information from context and load documents.
  const { address, context, domainName, collectionDocument  } = await getContext();

  // Get information from Blockchain.
  const { collectionContractFactory, collectionABI } = await getBlockchain(context, confData.chainId, address);

  title(`NFT Collection ${domainName}`);
  if (collectionDocument) logCollection(collectionDocument);

  // Deploy Smart Contract.
  const nftAddress = await deploySmartContract(collectionContractFactory, domainName, confData);

  // Create the Asset (cover).
  // await createAsset(context, confData, domainName);

  // Create Document (metadata).
  // await createMetadata(context, confData, domainName, nftAddress)
  await updateMetadata(context, confData, domainName, nftAddress)

  // Store ABI.
  // await storeABI(context, domainName, collectionABI);
  await updateABI(context, domainName, collectionABI);
}

/**
 * FUNCTIONS
 */
async function storeABI(context, domainName, collectionABI) {
  spinStart('Storing Contract ABI');
  await context.createDocument(`contracts/abi`,collectionABI,[]);
  spinStop();
  log('ABI       : ', `https://rpc.ctx.xyz/${domainName}/contracts/abi`);
}

async function updateABI(context, domainName, collectionABI) {
  spinStart('Updating Contract ABI');
  const document = await context.document(`${domainName}/contracts/abi`);
  const res = await document.data.update(collectionABI);
  spinStop();
  log('ABI       : ', `https://rpc.ctx.xyz/${domainName}/contracts/abi  => ${res.success ? 'success': 'fail'}`);
}

async function createMetadata(context, confData, domainName, nftAddress) {
  spinStart(`Creating NFT Contract Metadata in Context : ${confData.path}`);
    await context.createDocument(
      `${confData.path}`, {
        name: confData.name,
        symbol: confData.symbol,
        description: confData.description,
        chainId: confData.chainId,
        image: `https://rpc.ctx.xyz/${domainName}/assets/cover`,
        address: nftAddress,
        totalSupply: 0
      },
      ['web3/templates/contract']
    );
  spinStop();
  log('Saved     : ', `https://app.ctx.xyz/d/${domainName}/nft`);
}

async function updateMetadata(context, confData, domainName, nftAddress) {
  spinStart(`Updating NFT Contract Metadata in Context : ${confData.path}`);
    const document = await context.document(`${domainName}/nft`);
    const res = await document.data.update({
        name: confData.name,
        symbol: confData.symbol,
        description: confData.description,
        chainId: confData.chainId,
        image: `https://rpc.ctx.xyz/${domainName}/assets/cover`,
        address: nftAddress,
        totalSupply: 0
      },
      ['web3/templates/contract']
    );
  spinStop();
  log('Updated  : ', `https://app.ctx.xyz/d/${domainName}/nft => ${res.success ? 'success': 'fail'}`);
}

async function createAsset(context, confData, domainName) {
  spinStart('Uploading Cover to Context');
  await context.createAsset(`assets/cover`, `./data/assets/${confData.image}`);
  spinStop();
  log('Uploaded : ', `https://rpc.ctx.xyz/${domainName}/assets/cover`);
}

async function deploySmartContract(collectionContractFactory, domainName, confData): Promise <string> {
  spinStart('Deploying NFT Contract');
  const nftCollection = await collectionContractFactory.deploy(
    confData.name,
    confData.symbol,
    `https://rpc.ctx.xyz/${domainName}/${confData.path}`
  );
  await nftCollection.waitForDeployment();
  spinStop();
  log('Deployed : ', nftCollection.target);
  return nftCollection.target;
}

function logCollection(collectionDocument) {
  log('Document : ', collectionDocument.path);
  log('Version  : ', collectionDocument.versionNumber);
  log('ChainId  : ', collectionDocument.data.chainId);
  log('Address  : ', collectionDocument.data.address);
  process.exit();
}

main();