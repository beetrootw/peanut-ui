'use client'
import React, { createContext, useEffect, useState } from 'react'

import * as utils from '@/utils'
import * as consts from '@/constants'
import { useAccount } from 'wagmi'

type inputDenominationType = 'USD' | 'TOKEN'

export const tokenSelectorContext = createContext({
    selectedTokenAddress: '',
    selectedChainID: '',
    setSelectedTokenAddress: (address: string) => {},
    setSelectedChainID: (chainID: string) => {},
    selectedTokenPrice: 0 as number | undefined,
    setSelectedTokenPrice: (price: number | undefined) => {},
    inputDenomination: 'TOKEN' as inputDenominationType,
    setInputDenomination: (denomination: inputDenominationType) => {},
    refetchXchainRoute: false as boolean,
    setRefetchXchainRoute: (value: boolean) => {},
    resetTokenContextProvider: () => {},
})

export const TokenContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedTokenAddress, setSelectedTokenAddress] = useState('0x0000000000000000000000000000000000000000')
    const [selectedChainID, setSelectedChainID] = useState('1')
    const [selectedTokenPrice, setSelectedTokenPrice] = useState<number | undefined>(undefined)
    const [inputDenomination, setInputDenomination] = useState<inputDenominationType>('TOKEN')
    const [refetchXchainRoute, setRefetchXchainRoute] = useState<boolean>(false)

    const { isConnected } = useAccount()
    const preferences = utils.getPeanutPreferences()

    const updateSelectedChainID = (chainID: string) => {
        setSelectedTokenAddress('0x0000000000000000000000000000000000000000')
        setSelectedChainID(chainID)
    }

    const resetTokenContextProvider = () => {
        setSelectedTokenAddress(preferences?.tokenAddress ?? '0x0000000000000000000000000000000000000000')
        setSelectedChainID(preferences?.chainId ?? '1')
        setSelectedTokenPrice(undefined)
    }

    useEffect(() => {
        let isCurrent = true

        async function fetchAndSetTokenPrice(tokenAddress: string, chainId: string) {
            try {
                if (!consts.supportedMobulaChains.some((chain) => chain.chainId == chainId)) {
                    setSelectedTokenPrice(undefined)
                    setInputDenomination('TOKEN')
                    return
                } else {
                    const tokenPriceResponse = await utils.fetchTokenPrice(tokenAddress, chainId)
                    if (!isCurrent) {
                        return // if landed here, fetch outdated so discard the result
                    }
                    if (tokenPriceResponse?.price) {
                        setSelectedTokenPrice(tokenPriceResponse.price)
                        setInputDenomination('USD')
                    } else {
                        setSelectedTokenPrice(undefined)
                        setInputDenomination('TOKEN')
                    }
                }
            } catch (error) {
                console.log('error fetching tokenPrice, falling back to tokenDenomination')
            }
        }

        if (!isConnected) {
            setSelectedTokenPrice(undefined)
        } else if (selectedTokenAddress && selectedChainID) {
            setSelectedTokenPrice(undefined)
            fetchAndSetTokenPrice(selectedTokenAddress, selectedChainID)
            return () => {
                isCurrent = false
            }
        }
    }, [selectedTokenAddress, selectedChainID, isConnected])

    useEffect(() => {
        const prefs = utils.getPeanutPreferences()
        if (prefs) {
            setSelectedTokenAddress(prefs.tokenAddress)
            setSelectedChainID(prefs.chainId)
        }
    }, [])

    return (
        <tokenSelectorContext.Provider
            value={{
                selectedTokenAddress,
                setSelectedTokenAddress,
                selectedChainID,
                setSelectedChainID: updateSelectedChainID,
                selectedTokenPrice,
                setSelectedTokenPrice,
                inputDenomination,
                setInputDenomination,
                refetchXchainRoute,
                setRefetchXchainRoute,
                resetTokenContextProvider,
            }}
        >
            {children}
        </tokenSelectorContext.Provider>
    )
}
