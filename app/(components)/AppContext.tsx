"use client";
import {
    useWallet,
    InputTransactionData,
} from "@aptos-labs/wallet-adapter-react";
import {
    Account,
    AccountAddress,
    AnyNumber,
    Aptos,
    AptosConfig,
    InputViewFunctionData,
    Network,
    NetworkToNetworkName,
    Ed25519PrivateKey 
} from "@aptos-labs/ts-sdk";
import { FC, ReactNode, useState, useContext, createContext, useEffect } from "react";

import { AlertProvider, useAlert } from "./AlertProvider";
import { AutoConnectProvider } from "./AutoConnectProvider";
import { WalletContext } from "./WalletContext";
import { UserContextProvider } from "./UserContext";

interface AppContextState {
    aptos: any;
    fetchAdminAccount: (adminPrivateKey: string) => Promise<Account>;
    fetchBalance: (accountAddress: AccountAddress, versionToWaitFor?: bigint | undefined) => void;
    fetchFaBalance: (accountAddress: AccountAddress, assetType: string) => Promise<number>;
    fundWallet: (address: AccountAddress) => void;
    mintCoin: (admin: Account, receiver: AccountAddress, amount: AnyNumber, coinName: string) => Promise<string>;
    burnCoin: (admin: Account, fromAddress: AccountAddress, coinName: string, amount: AnyNumber) => Promise<string>;
    swapCoin: (
        adminForMint: Account,
        adminForBurn: Account,
        account: AccountAddress,
        coinNameToMint: string,
        coinNameToBurn: string,
        amountToTransfer: number,
        amountToMint: AnyNumber,
        amountToBurn: AnyNumber
    ) => Promise<string>;
    transferAPT: (accountAddress: AccountAddress, recipient: AccountAddress, amount: number) => Promise<string>;
    transferAPTBack: (admin: Account, recipient: AccountAddress, amount: number) => Promise<string>;
    myBalance: number | 0;
    setMyBalance: (myBalance: number | 0) => void;
    alphaBalance: number | 0;
    setAlphaBalance: (alphaBalance: number | 0) => void;
    betaBalance: number | 0;
    setBetaBalance: (betaBalance: number | 0) => void;
};

export const AppContexts = createContext<AppContextState | undefined>(
    undefined
);

export function useAppContext(): AppContextState {
    const context = useContext(AppContexts);
    if (!context)
        throw new Error("useAppContext must be used within an AppContextProvider");
    return context;
};

const AppContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    const {
        signAndSubmitTransaction,
    } = useWallet();
    const { setSuccessAlertMessage, setErrorAlertMessage, setLoadingAlertMessage, setLoadingUpdateAlertMessage } = useAlert();
    const [myBalance, setMyBalance] = useState<number>(0);
    const [alphaBalance, setAlphaBalance] = useState<number>(0);
    const [betaBalance, setBetaBalance] = useState<number>(0);

    const fetchAdminAccount = async (adminPrivateKey: string) : Promise<Account> => {
        const privateKey = new Ed25519PrivateKey(adminPrivateKey);
        const account = await Account.fromPrivateKey({ privateKey });

        return account;
    };

    const fetchBalance = async (accountAddress: AccountAddress, versionToWaitFor?: bigint | undefined) => {
        try {
            const amount = await aptos.getAccountAPTAmount({
                accountAddress,
                minimumLedgerVersion: versionToWaitFor ?? undefined,
            });
            
            setMyBalance(amount / 100000000);
        } catch (error: any) {
            setErrorAlertMessage(error.message);
        }
    };

    const fetchFaBalance = async (accountAddress: AccountAddress, assetType: string) : Promise<number> => {
        try {
            const data = await aptos.getCurrentFungibleAssetBalances({
                options: {
                    where: {
                        owner_address: { _eq: accountAddress.toStringLong() },
                        asset_type: { _eq: assetType },
                    },
                },
            });
    
            return data[0]?.amount;
        } catch (error: any) {
            setErrorAlertMessage(error.message);
            return 0;
        }
    };

    const fundWallet = async (address: AccountAddress) => {
        try {
            await aptos.fundAccount({ accountAddress: address, amount: 100_000_000 });
            setSuccessAlertMessage(`Successful to fund wallet to 0x${address.toString().substring(2, 6)}...${address.toString().substring(address.toString().length - 5, address.toString().length)}`);
            await fetchBalance(address);
        } catch (error: any) {
            setErrorAlertMessage(error.message);
        }
    };

    const transferAPT = async (accountAddress: AccountAddress, recipient: AccountAddress, amount: number) : Promise<string> => {
        const transaction: InputTransactionData = {
            data: {
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [recipient.toStringLong(), amount],
            },
        };

        const loadingMessage = "Please accept transaction in your wallet";

        const id = setLoadingAlertMessage(loadingMessage);

        try {
            const response = await signAndSubmitTransaction(transaction);
            await aptos.waitForTransaction({
                transactionHash: response.hash,
            });
            
            setLoadingUpdateAlertMessage(id, `Transaction Confirmed with hash: ${response.hash}`, "success");
            fetchBalance(accountAddress);
            return response.hash;
        } catch (error: any) {
            setLoadingUpdateAlertMessage(id, "Transaction failed. Please try again later", "error");
            return "Error";
        }
    };

    const transferAPTBack = async (admin: Account, recipient: AccountAddress, amount: number) : Promise<string> => {
        try {
            const txn = await aptos.transaction.build.simple({
                sender: admin.accountAddress,
                data: {
                function: "0x1::coin::transfer",
                typeArguments: ["0x1::aptos_coin::AptosCoin"],
                functionArguments: [recipient, amount],
                },
            });

            const committedTxn = await aptos.signAndSubmitTransaction({ signer: admin, transaction: txn });

            await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
            setSuccessAlertMessage(`Successful to return your APT with hash ${committedTxn.hash}`)
            return committedTxn.hash;
        } catch (error: any) {
            setErrorAlertMessage(error.message);
            return "Error";
        }
    };

    const mintCoin = async (admin: Account, receiver: AccountAddress, amount: AnyNumber, coinName: string) : Promise<string> => {
        try {
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
        } catch (error: any) {
            return "Error";
        }
    };

    const burnCoin = async (admin: Account, fromAddress: AccountAddress, coinName: string, amount: AnyNumber) : Promise<string> => {
        try {
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
        } catch (error: any) {
            return "Error";
        }
    };

    const swapCoin = async (
        adminForMint: Account,
        adminForBurn: Account,
        account: AccountAddress,
        coinNameToMint: string,
        coinNameToBurn: string,
        amountToTransfer: number,
        amountToMint: AnyNumber,
        amountToBurn: AnyNumber
    ) : Promise<string> => {
        const loadingMessage = `Please wait. Processing swap ${amountToBurn} ${coinNameToBurn} coin to ${amountToMint} ${coinNameToMint} coin`;

        const id = setLoadingAlertMessage(loadingMessage);
        try {
            const txnTransfer = await transferAPT(account, adminForMint.accountAddress, amountToTransfer);
            if (txnTransfer === "Error") {
                setLoadingUpdateAlertMessage(id, "Failed to transfer coin. Please try again later", "error");
                return "Error";
            }

            const txnBurn = await burnCoin(adminForBurn, account, coinNameToBurn, amountToBurn);
            if (txnBurn === "Error") {
                setLoadingUpdateAlertMessage(id, "Failed to burn coin. Please try again later", "error");
                const txnTransferBack = transferAPTBack(adminForMint, account, amountToTransfer);
                return "Error";
            }
    
            const txnMint = await mintCoin(adminForMint, account, amountToMint, coinNameToMint);
            if (txnMint === "Error") {
                setLoadingUpdateAlertMessage(id, "Failed to mint coin. Please try again later", "error");
                const txnTransferBack = transferAPTBack(adminForMint, account, amountToTransfer);
                return "Error";
            }
    
            setLoadingUpdateAlertMessage(id, ``Swap ${amountToBurn} ${coinNameToBurn} coin to ${amountToMint} ${coinNameToMint} coin success!`, "success");
            return txnMint;
        } catch (error) {
            setLoadingUpdateAlertMessage(id, "Failed to swap coin. Please try again later", "error");
            return "Error";
        }
    };

    return (
        <AppContexts.Provider
        value={{ 
            aptos,
            fetchAdminAccount,
            fetchBalance, 
            fetchFaBalance, 
            fundWallet, 
            mintCoin,
            burnCoin,
            swapCoin,
            transferAPT,
            transferAPTBack,
            myBalance, 
            setMyBalance, 
            alphaBalance, 
            setAlphaBalance, 
            betaBalance, 
            setBetaBalance }}>
            {children}
        </AppContexts.Provider>
    )
};

export const AppContext: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <AlertProvider>
        <AutoConnectProvider>
        <WalletContext>
        <UserContextProvider>
            <AppContextProvider>{children}</AppContextProvider>
        </UserContextProvider>
        </WalletContext>
        </AutoConnectProvider>
        </AlertProvider>
    );
};
