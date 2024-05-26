import { useState, useRef, useEffect, ReactElement, FC } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Button from '@mui/material/Button';

import { useUserContext } from '../(components)/UserContext';
import { ALPHA, DEFAULT_VALUE } from '../utils/SupportedCoins';
import { Account } from '@aptos-labs/ts-sdk';

import SwapField from './SwapField';
import { useAppContext } from '../(components)/AppContext';

interface SwapComponentProps {
    getBalance: () => Promise<void>;
    alphaAdmin: Account | null;
    betaAdmin: Account | null;
    ALPHA_ADDRESS: string | undefined;
    BETA_ADDRESS: string | undefined;
};

const SwapComponent: FC<SwapComponentProps> = ({getBalance, alphaAdmin, betaAdmin, ALPHA_ADDRESS, BETA_ADDRESS}) => {
    const { alphaBalance, betaBalance, swapCoin } = useAppContext();
    const { userAddress } = useUserContext();

    const INSUFFICIENT_VALUE = 'Insufficient coin';
    const ENTER_AMOUNT = 'Enter an amount';
    const SWAP = 'Swap';

    const inputValueRef = useRef<HTMLInputElement | null>(null);
    const outputValueRef = useRef<HTMLInputElement | null>(null);

    const isReversed = useRef(false);

    const [swapBtnText, setSwapBtnText] = useState(ENTER_AMOUNT);
    const [srcCoinComp, setSrcCoinComp] = useState<ReactElement | null>(null);
    const [destCoinComp, setDestCoinComp] = useState<ReactElement | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [outputValue, setOutputValue] = useState<string>('');
    const [srcCoin, setSrcCoin] = useState(DEFAULT_VALUE);
    const [destCoin, setDestCoin] = useState(ALPHA);

    const srcCoinObj = {
        id: 'srcCoin',
        value: inputValue,
        setValue: setInputValue,
        defaultValue: srcCoin,
        ignoreValue: destCoin,
        setCoin: setSrcCoin,
    };
    
    const destCoinObj = {
        id: 'destCoin',
        value: outputValue,
        setValue: setOutputValue,
        defaultValue: destCoin,
        ignoreValue: srcCoin,
        setCoin: setDestCoin,
    }

    const handleReverseExchange = () => {
        // Setting the isReversed value to prevent the input/output values
        // being calculated in their respective side - effects
        isReversed.current = true;

        setInputValue('');
        setOutputValue('');

        setSrcCoin(destCoin);
        setDestCoin(srcCoin);
    };

    const getSwapBtnClassName = () => {
        let className = 'p-4 w-full my-2 rounded-xl text-lg'
        className +=
        swapBtnText === ENTER_AMOUNT
            ? ' text-zinc-400 bg-zinc-800 pointer-events-none'
            : ' bg-[#25fff2] text-[#091a1f] hover:bg-[#091a1f] hover:text-[#25fff2]'
        className += swapBtnText === INSUFFICIENT_VALUE ? ' bg-rose-700 pointer-events-none text-white' : ''
        return className;
    };

    const handleSwap = async () => {
        const aptAmount = 50_000;
        const amountTarget = Number(outputValue);
        const amountFrom = Number(inputValue);
        const coinNameFrom = srcCoin.toLowerCase();
        const coinNameTarget = destCoin.toLowerCase();

        if(alphaAdmin && betaAdmin && ALPHA_ADDRESS && BETA_ADDRESS && userAddress) {
            if (srcCoin === 'Alpha' && destCoin !== 'Alpha') {
                const txnHash = await swapCoin(betaAdmin, alphaAdmin, userAddress, coinNameTarget, coinNameFrom, aptAmount, amountTarget, amountFrom);
                getBalance();
                setInputValue('');
                setOutputValue('');
            } else if (srcCoin !== 'Alpha' && destCoin === 'Alpha') {
                const txnHash = await swapCoin(alphaAdmin, betaAdmin, userAddress, coinNameTarget, coinNameFrom, aptAmount, amountTarget, amountFrom);
                getBalance();
                setInputValue('');
                setOutputValue('');
            }
        }
    };

    const checkBalance = (coinBalance: number, value: string) => {
        if (coinBalance >= Number(value)) {
            setSwapBtnText(SWAP);
        } else {
            setSwapBtnText(INSUFFICIENT_VALUE);
        }
    }

    const populateOutputValue = async () => {
        if (
            destCoin === DEFAULT_VALUE ||
            srcCoin === DEFAULT_VALUE ||
            !inputValue
        )
        return
    
        try {
            getBalance();
            if (srcCoin === ALPHA) {
                checkBalance(alphaBalance, inputValue);
            } else {
                checkBalance(betaBalance, inputValue);
            }
            setOutputValue(inputValue);
        } catch (error) {
            setOutputValue('0');
        }
    };

    const populateInputValue = async () => {
        if (
            destCoin === DEFAULT_VALUE ||
            srcCoin === DEFAULT_VALUE ||
            !outputValue
        )
        return
    
        try {
            getBalance();
            if (destCoin === ALPHA) {
                checkBalance(alphaBalance, outputValue);
            } else {
                checkBalance(betaBalance, outputValue);
            }
            setInputValue(outputValue);
        } catch (error) {
            setInputValue('0');
        }
    };

    useEffect(() => {
        if (
            document.activeElement &&
            document.activeElement !== outputValueRef.current &&
            document.activeElement.ariaLabel !== 'srcCoin' &&
            !isReversed.current
        ) {
            populateOutputValue();
        }

        setSrcCoinComp(<SwapField obj={srcCoinObj} ref={inputValueRef} />);
    
        if (inputValue?.length === 0 || Number(inputValue) === 0) {
            setOutputValue('');
            setSwapBtnText(ENTER_AMOUNT);
        }
    }, [inputValue, destCoin]);
    
    useEffect(() => {
        if (
            document.activeElement &&
            document.activeElement !== inputValueRef.current &&
            document.activeElement.ariaLabel !== 'destCoin' &&
            !isReversed.current
        ) {
            populateInputValue();
        }

        setDestCoinComp(<SwapField obj={destCoinObj} ref={outputValueRef} />);

        if (outputValue?.length === 0 || Number(outputValue) === 0) {
            setSwapBtnText(ENTER_AMOUNT);
            setInputValue('');
        }

        // Resetting the isReversed value if its set
        if (isReversed.current) isReversed.current = false;
    }, [outputValue, srcCoin]);

    return (
        <div className='bg-zinc-900 w-[35%] p-4 px-6 rounded-xl place-self-center'>
            <div className='flex items-center justify-between py-4 px-1'>
                <p>Swap</p>
                <SettingsIcon className='h-6' />
            </div>
            <div className='relative bg-[#212429] p-4 py-6 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600'>
                {srcCoinComp}

                <ArrowDownwardIcon
                className='absolute left-1/2 -translate-x-1/2 -bottom-6 size-10 p-1 bg-[#212429] border-4 border-zinc-900 text-zinc-300 rounded-xl cursor-pointer hover:scale-110'
                onClick={handleReverseExchange}
                />
            </div>

            <div className='bg-[#212429] p-4 py-6 rounded-xl mt-2 border-[2px] border-transparent hover:border-zinc-600'>
                {destCoinComp}
            </div>

            <Button
                variant="contained"
                className={getSwapBtnClassName()}
                onClick={() => {
                    if (swapBtnText === SWAP) handleSwap();
                }}
            >
                {swapBtnText}
            </Button>
        </div>
    )
};

export default SwapComponent;