"use client";
import { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { MenuProps } from 'antd';
import { Dropdown, Typography } from 'antd';
import {
    useWallet
} from "@aptos-labs/wallet-adapter-react";
import dynamic from "next/dynamic";

import { useAutoConnect } from './AutoConnectProvider';
import { useAlert } from "./AlertProvider";
import { useUserContext } from './UserContext';

const theme = createTheme({
    palette: {
        primary: {
        main: "#000000",
        },
        secondary: {
        main: "#FFFFFF",
        },
    },
});

const Header = () => {
    const { account, connected, disconnect, wallet } = useWallet();
    const { notification, setNotification } = useAlert();
    const { fetchUserAddress, setUserAddress } = useUserContext();
    const { setAutoConnect } = useAutoConnect();
    const { Paragraph } = Typography;
    const [open, setOpen] = useState(false);
    const [badge, setBadge] = useState<number>(0);
    const sortedNotifications = [...notification].reverse();

    const clearAllNotifications = () => {
        localStorage.removeItem('aptos-notification');
        setNotification([]);
    };

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
    
        setOpen(false);
    };

    const copyWallet = (e: any) => {
        e.preventDefault();
        if (account?.address) {
            navigator.clipboard.writeText(`${account.address}`);
            setOpen(true);
        }
    };

    const logOut = () => {
        disconnect();
        localStorage.clear();
        setUserAddress(undefined);
        setNotification([]);
    };

    const notifications: MenuProps['items'] = [
        ...sortedNotifications.map((notif, index) => ({
            key: index.toString(),
            label: notif,
        })),
        {
            key: (notification.length + 1).toString(),
            label: notification.length > 0 ? (
                <div onClick={clearAllNotifications} className="bg-slate-300 text-center mt-4 mb-2 hover:bg-red-600 hover:text-white px-4 py-2 rounded">
                    Clear all notifications
                </div>
            ) : (
                <div>
                    No Notifications
                </div>
            )
        }
    ];

    const profile: MenuProps['items'] = [
        {
            key: 1,
            label: (
                <Paragraph
                    onClick={copyWallet}
                    className='pt-3'
                >
                    {account ? `0x${account.address.substring(2, 6)}...${account.address.substring(account.address.length - 5, account.address.length)}` : ''}
                </Paragraph>
            )
        },
        {
            key: 2,
            label: (
                <div onClick={logOut} className="bg-slate-300 hover:bg-red-600 hover:text-white px-4 py-2 rounded">
                    Log Out
                </div>
            )
        }
    ];

    const WalletSelectorAntDesign = dynamic(
        () => import("../(components)/WalletSelectorAntDesign"),
        {
            loading: () => {
                return <CircularProgress color="secondary" size={30} className='mr-8'/>
            },
            suspense: false,
            ssr: false,
        }
    );
    
    useEffect(() => {
        setBadge(notification.length);
    }, [notification]);

    useEffect(() => {
        fetchUserAddress();
        setAutoConnect(true);
    }, [account]);

    return (
        <ThemeProvider theme={theme}>
        <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
            <Toolbar className='flex place-items-center'>
                
            <img src='aptos_word_dark.svg' className='max-h-10'/>

            <Box sx={{ flexGrow: 1 }} />
            {connected ? (
                <Box sx={{ display: { xs: 'none', md: 'flex' } }} className='gap-5'>
                    <Dropdown menu={{ items: notifications, style:{maxHeight: '50vh', overflow: 'scroll', paddingTop: '10px', paddingBottom: '10px'} }} placement="bottomRight" arrow={{ pointAtCenter: true }} className='hover:text-[#25fff2]'>
                        <IconButton
                            size="medium"
                            aria-label={`show ${badge} new notifications`}
                            color="inherit"
                        >
                            <Badge badgeContent={badge} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                    </Dropdown>
                    
                    <Dropdown menu={{ items: profile, className: 'grid place-content-center text-center' }} trigger={['click']} placement="bottomRight">
                        <button className='flex gap-2 px-2 rounded-md border hover:text-[#25fff2] hover:border-[#25fff2]'>
                            <img
                                src={wallet?.icon}
                                className='size-6 place-self-center'
                            />
                            <div className="place-self-center">
                                {account ? `0x${account.address.substring(2, 6)}...${account.address.substring(account.address.length - 5, account.address.length)}` : ''}
                            </div>
                        </button>
                    </Dropdown>
                </Box>
            ) : (
                <WalletSelectorAntDesign />
            )}
            </Toolbar>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <div className='flex gap-2 bg-slate-500 px-4 py-4 rounded-md'>
                    <CheckCircleIcon className='text-lime-300'/>
                    Address Copied
                </div>
            </Snackbar>
        </AppBar>
        </Box>
        </ThemeProvider>
    );
}

export default Header;
