import {
    Account,
    AccountAddress,
    AnyNumber,
    Aptos,
    AptosConfig,
    InputViewFunctionData,
    Network,
    Ed25519PrivateKey
} from "@aptos-labs/ts-sdk";
import { compilePackage, getPackageBytesToPublish } from "./utils";

const APTOS_NETWORK: Network = Network.TESTNET;
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

async function mintCoin(admin: Account, receiver: AccountAddress, amount: AnyNumber, coinName: string): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
            function: `${admin.accountAddress}::${coinName}::mint`,
            functionArguments: [receiver, amount],
        },
    });

    const senderAuthenticator = await aptos.transaction.sign({ signer: admin, transaction });
    const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

    return pendingTxn.hash;
};

async function burnCoin(admin: Account, fromAddress: AccountAddress, coinName: string, amount: AnyNumber): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
            function: `${admin.accountAddress}::${coinName}::burn`,
            functionArguments: [fromAddress, amount],
        },
    });

    const senderAuthenticator = await aptos.transaction.sign({ signer: admin, transaction });
    const pendingTxn = await aptos.transaction.submit.simple({ transaction, senderAuthenticator });

    return pendingTxn.hash;
};

async function getMetadata(admin: Account, coinName: string): Promise<string> {
    const payload: InputViewFunctionData = {
        function: `${admin.accountAddress}::${coinName}::get_metadata`,
        functionArguments: [],
    };
    const res = (await aptos.view<[{ inner: string }]>({ payload }))[0];
    return res.inner;
};

const getStackBalance = async (owner: AccountAddress, assetType: string): Promise<number> => {
    const data = await aptos.getCurrentFungibleAssetBalances({
        options: {
            where: {
            owner_address: { _eq: owner.toStringLong() },
            asset_type: { _eq: assetType },
            },
        },
    });

    return data[0]?.amount ?? 0;
};

async function main() {
    const myAddress = AccountAddress.from("0x74119871eaca2f8e5f39f60cdc87fcbda42bfb02efb09cfb6b698364d4cefa5c");
    const betaAdmin = Account.generate();

    console.log("\n=== Addresses ===");
    console.log(`Beta Admin: ${betaAdmin.accountAddress.toString()}`);
    console.log(`Beta Admin private key: ${betaAdmin.privateKey.toString()}`); // Save it for later use in frontend
    console.log(`My Address: ${myAddress.toString()}`);
    console.log("DONT FORGET TO SAVE ADMIN'S PRIVATE KEY FOR LATER USE IN FRONTEND!!!");

    await aptos.fundAccount({ accountAddress: betaAdmin.accountAddress, amount: 100_000_000 });

    console.log("\n=== Compiling Beta package locally ===");
    compilePackage("stackcoin", "stackcoin/stackcoin.json", [{ name: "Beta", address: betaAdmin.accountAddress }]);

    const { metadataBytes, byteCode } = getPackageBytesToPublish("stackcoin/stackcoin.json");

    console.log("\n===Publishing Beta package===");
    const transaction = await aptos.publishPackageTransaction({
        account: betaAdmin.accountAddress,
        metadataBytes,
        moduleBytecode: byteCode,
    });
    const response = await aptos.signAndSubmitTransaction({
        signer: betaAdmin,
        transaction,
    });
    console.log(`Transaction hash: ${response.hash}`);
    await aptos.waitForTransaction({
        transactionHash: response.hash,
    });

    const betaMetadataAddress = await getMetadata(betaAdmin, "beta");
    console.log("Beta metadata address:", betaMetadataAddress); // Save it for later use in frontend
    console.log("DONT FORGET TO SAVE BETA METADATA ADDRESS FOR LATER USE IN FRONTEND!!!");

    console.log("All the balances here refer to the balance in primary fungible stores of each account.");
    console.log(`Beta Admin's initial Beta balance: ${await getStackBalance(betaAdmin.accountAddress, betaMetadataAddress)}.`);
    console.log(`My Address's initial Beta balance: ${await getStackBalance(myAddress, betaMetadataAddress)}.`);

    console.log("Beta Admin mints My Address 100 coins.");
    const mintBetaCoinTransactionHash = await mintCoin(betaAdmin, myAddress, 100, "beta");

    await aptos.waitForTransaction({ transactionHash: mintBetaCoinTransactionHash });

    console.log(
        `My Address's new Beta primary fungible store balance: ${await getStackBalance(myAddress, betaMetadataAddress)}.`,
    );
}

main();