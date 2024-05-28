# Aptos Token Swap DApp Project Bounty

[Aptos Token Swap DApp](https://aptos-token-swap.vercel.app/)

For this project, I created 2 coins published by 2 different admins, which can be seen in the [Contract Coin](https://github.com/ikhsandadan/aptos-token-swap/tree/main/Contract%20Coins) folder: the Alpha coin and the Beta coin.

To publish them, we first need to install all the dependencies by running `pnpm install`. Once that's done, we can run the `pnpm run stackcoin` command to publish the modules for both the Alpha and Beta coins. Don't forget to save the Alpha and Beta admin private keys, as well as the Alpha and Beta coin metadata addresses for the frontend app's .env file.

After that, we can run the frontend app.

## Frontend App
This is the initial view of the app:
![1](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/796c6a24-a9a2-4646-9d8c-ee90249370fa)


Here, I'm using the Aptos Wallet Adapter so users can log in using wallets such as Martian, Petra, Nightly, and others. In this case, I'm using Martian. After logging in with the wallet, the view will look like this:
![2](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/6519c76e-ae1b-4077-b5d0-dd57768650fc)


Here, we can see 4 components: our Aptos coin balance, where we can add Aptos faucet to our wallet; our Alpha coin balance, where we can buy 10 Alpha coins for 0.001 APT; our Beta coin balance, where we can buy 10 Beta coins for 0.001 APT; and finally, the Swap coin feature.

## Aptos Coin Faucet
This feature allows users to view their Aptos coin (APT) balance and add 1 Aptos coin (APT) to their wallet.
![3](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/21b6a0bf-f26a-42a8-936b-add9692ece63)


## Alpha Coin
This is the coin we created and published using the Alpha admin address. The frontend feature allows users to view their Alpha coin balance and buy 10 Alpha coins for 0.001 APT, which will be transferred to the Alpha admin.
![4](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/05d05b04-6fa5-4287-a63b-ba80f1dc194a)


## Beta Coin
This is the coin we created and published using the Beta admin address. The frontend feature allows users to view their Beta coin balance and buy 10 Beta coins for 0.001 APT, which will be transferred to the Beta admin.
![5](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/fa7134a9-69a9-48c3-b53d-3c66332e3d09)


## Swap
This feature allows users to swap Alpha coins for Beta coins, or vice versa, at a 1:1 ratio (1 Alpha coin for 1 Beta coin, or vice versa). Users can enter the amount and choose which coin to swap. If the balance of the source coin is sufficient, the button will change from "ENTER AN AMOUNT" to "SWAP". However, if the balance is insufficient, the button will change to "INSUFFICIENT COIN". To swap coins, users need to pay 0.0005 APT as a fee, which will be transferred to the destination coin's admin.

![6](https://github.com/ikhsandadan/aptos-token-swap/assets/116878888/13f4a98a-9db8-4fd7-8e32-b6ce0759ecaf)


I've implemented this feature in a simple way, with the following steps:

 1. The user pays 0.0005 APT to the destination coin's admin.
 2. The source coin's admin burns the user's coins.
 3. The destination coin's admin mints coins to the user.
 
If the process fails after the user has paid the 0.0005 APT fee, the fee will be automatically refunded to the user.

Here's a snippet of the code:
 

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
    
            setLoadingUpdateAlertMessage(id, `Swap ${amountToBurn} ${coinNameToBurn} coin to ${amountToMint} ${coinNameToMint} coin success!`, "success");
            return txnMint;
        } catch (error) {
            setLoadingUpdateAlertMessage(id, "Failed to swap coin. Please try again later", "error");
            return "Error";
        }
    };


And finally, here's a video demonstrating how to swap coins.

<iframe width="560" height="315" src="https://www.youtube.com/embed/_pf6tlAFZJ8?si=QZ86AdDBEsBbIt8Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
