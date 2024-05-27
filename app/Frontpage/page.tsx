"use client";
import { useEffect, useState } from 'react';
import {
    Account
} from "@aptos-labs/ts-sdk";
import Button from '@mui/material/Button';

import { useUserContext } from '../(components)/UserContext';
import { useAppContext } from '../(components)/AppContext';
import { useAlert } from '../(components)/AlertProvider';
import SwapComponent from '../(components)/SwapComponent';

const Frontpage = () => {
    const ALPHA_ADDRESS = process.env.NEXT_PUBLIC_ALPHA_METADATA_ADDRESS;
    const BETA_ADDRESS = process.env.NEXT_PUBLIC_BETA_METADATA_ADDRESS;
    const ALPHA_ADMIN_PRIVATEKEY = process.env.NEXT_PUBLIC_ADMIN_PRIVATEKEY_ALPHA;
    const BETA_ADMIN_PRIVATEKEY = process.env.NEXT_PUBLIC_ADMIN_PRIVATEKEY_BETA;
    const { 
        fetchAdminAccount, 
        fetchBalance, 
        fetchFaBalance, 
        fundWallet, 
        mintCoin,
        transferAPT,
        transferAPTBack,
        myBalance, 
        alphaBalance, 
        setAlphaBalance, 
        betaBalance, 
        setBetaBalance 
    } = useAppContext();
    const { userAddress } = useUserContext();
    const [alphaAdmin, setAlhpaAdmin] = useState<Account | null>(null);
    const [betaAdmin, setBetaAdmin] = useState<Account | null>(null);
    const { setSuccessAlertMessage, setErrorAlertMessage } = useAlert();

    const handleFundWallet = async () => {
        if (userAddress) {
            await fundWallet(userAddress);
        }
    };

    const handleMint = async (event: React.SyntheticEvent | Event) => {
        const target = event.target as HTMLElement;

        if (alphaAdmin && userAddress && betaAdmin) {
            const aptAmount = 100_000;
            const transferHash = await transferAPT(userAddress, alphaAdmin.accountAddress, aptAmount);

            if (transferHash !== "Error") {
                const amount = 10
                const coinName = target.accessKey;
                let txnHash: string | null = null;

                try {           
                    if (coinName === 'alpha') {
                        txnHash = await mintCoin(alphaAdmin, userAddress, amount, coinName);
                    } else {
                        txnHash = await mintCoin(betaAdmin, userAddress, amount, coinName);
                    }
            
                    if (txnHash) {
                        setSuccessAlertMessage(`Successful fund ${amount} ${coinName} coin with Hash ${txnHash}`);
                        getBalance();
                    } else {
                        setErrorAlertMessage('Failed to mint coin. Please try again later.');
                        
                        if (coinName === 'alpha') {
                            transferAPTBack(alphaAdmin, userAddress, amount);
                        } else {
                            transferAPTBack(betaAdmin, userAddress, amount);
                        }
                    }
                } catch (error: any) {
                    setErrorAlertMessage(error.message);
                    if (coinName === 'alpha') {
                        transferAPTBack(alphaAdmin, userAddress, amount);
                    } else {
                        transferAPTBack(betaAdmin, userAddress, amount);
                    }
                }
            }
        }
    };

    const getBalance = async () => {
        if (userAddress && ALPHA_ADDRESS && BETA_ADDRESS) {
            await fetchBalance(userAddress);

            const currentAlphaBalance = await fetchFaBalance(userAddress, ALPHA_ADDRESS);
            setAlphaBalance(currentAlphaBalance);

            const currentBetaBalance = await fetchFaBalance(userAddress, BETA_ADDRESS);
            setBetaBalance(currentBetaBalance);
        };
    };

    useEffect(() => {
        if (ALPHA_ADMIN_PRIVATEKEY && BETA_ADMIN_PRIVATEKEY) {
            const adminAlphaAccount = fetchAdminAccount(ALPHA_ADMIN_PRIVATEKEY);
            adminAlphaAccount.then((account: any) => {
                setAlhpaAdmin(account);
            })

            const adminBetaAccount = fetchAdminAccount(BETA_ADMIN_PRIVATEKEY);
            adminBetaAccount.then((account: any) => {
                setBetaAdmin(account);
            })
        }

        getBalance();
    }, [userAddress]);

    return (
        <div style={{minHeight: '90vh'}}>
            {userAddress ? 
            <div className='grid grid-flow-row auto-rows-auto gap-10'>
                <div className='text-center font-bold text-xl pt-2'>Aptos Swap Token</div>

                <div className='flex gap-10 place-self-center'>
                    <div className='grid place-content-center gap-4 bg-[#212429] p-4 rounded-lg'>
                        <div className='flex w-auto place-content-center place-self-center bg-[#091a1f] px-4 py-2 rounded-full gap-5'>
                            <div className='place-self-center text-xs text-center text-[#25fff2]'>
                                Aptos Coin
                            </div>
                            <div className='flex place-content-center text-center bg-gray-700 px-4 py-1 w-auto rounded-full text-sm'>
                                {myBalance === 0 ? 
                                    <div>0</div>
                                    :
                                    <div>{myBalance.toFixed(4)} APT</div>
                                }
                            </div>
                        </div>
                        <div className='text-center'>Fund your wallet with 1 Aptos coin</div>
                        <Button variant="contained" onClick={handleFundWallet} className='w-auto place-self-center bg-[#25fff2] text-[#091a1f] hover:bg-[#091a1f] hover:text-[#25fff2]'>Fund 1 Aptos Coin to Wallet</Button>
                    </div>

                    <div className='grid place-content-center gap-4 bg-[#212429] p-4 rounded-lg'>
                        <div className='flex w-auto place-content-center place-self-center bg-[#091a1f] px-4 py-2 rounded-full gap-5'>
                            <div className='place-self-center text-xs text-center text-[#25fff2]'>
                                Alpha Coin
                            </div>
                            <div className='flex place-content-center text-center bg-gray-700 px-4 py-1 w-auto rounded-full text-sm'>
                                <div>{alphaBalance} AA</div>
                            </div>
                        </div>
                        <div className='text-center'>Buy 10 Alpha coin with price of 0.001 APT</div>
                        <Button variant="contained" onClick={handleMint} accessKey='alpha' className='w-auto place-self-center bg-[#25fff2] text-[#091a1f] hover:bg-[#091a1f] hover:text-[#25fff2]'>Buy 10 Alpha Coin to Wallet</Button>
                    </div>

                    <div className='grid place-content-center gap-4 bg-[#212429] p-4 rounded-lg'>
                        <div className='flex w-auto place-content-center place-self-center bg-[#091a1f] px-4 py-2 rounded-full gap-5'>
                            <div className='place-self-center text-xs text-center text-[#25fff2]'>
                                Beta Coin
                            </div>
                            <div className='flex place-content-center text-center bg-gray-700 px-4 py-1 w-auto rounded-full text-sm'>
                                <div>{betaBalance} BB</div>
                            </div>
                        </div>
                        <div className='text-center'>Buy 10 Beta coin with price of 0.001 APT</div>
                        <Button variant="contained" onClick={handleMint} accessKey='beta' className='w-auto place-self-center bg-[#25fff2] text-[#091a1f] hover:bg-[#091a1f] hover:text-[#25fff2]'>Buy 10 Beta Coin to Wallet</Button>
                    </div>
                </div>

                <SwapComponent getBalance={getBalance} alphaAdmin={alphaAdmin} betaAdmin={betaAdmin} ALPHA_ADDRESS={ALPHA_ADDRESS} BETA_ADDRESS={BETA_ADDRESS}/>
            </div>
            : 
            <div className='flex place-content-center'>
                <div className='text-center text-3xl mt-60'>Please Connect To Your Wallet</div>
            </div>
            }
        </div>
    )
}

export default Frontpage;
