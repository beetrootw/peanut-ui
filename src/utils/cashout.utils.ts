// import crypto from 'crypto'
import * as interfaces from '@/interfaces'
import * as consts from '@/constants'
import * as utils from '@/utils'
import countries from 'i18n-iso-countries'
// export const hashPassword = (
//     password: string
// ): {
//     salt: string
//     hash: string
// } => {
//     const salt = crypto.randomBytes(16).toString('hex')

//     const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')

//     return { salt, hash }
// }

// export const validatePassword = ({ password, salt, hash }: { password: string; salt: string; hash: string }) => {
//     const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
//     return hash === hashVerify
// }

export const convertPersonaUrl = (url: string) => {
    const parsedUrl = new URL(url)

    const templateId = parsedUrl.searchParams.get('inquiry-template-id')
    const iqtToken = parsedUrl.searchParams.get('fields[iqt_token]')
    const developerId = parsedUrl.searchParams.get('fields[developer_id]')
    const referenceId = parsedUrl.searchParams.get('reference-id')
    const origin = encodeURIComponent(window.location.origin)

    return `https://bridge.withpersona.com/widget?environment=production&inquiry-template-id=${templateId}&fields[iqt_token=${iqtToken}&iframe-origin=${origin}&redirect-uri=http%3A%2F%2Flocalhost%3A3000&fields[developer_id]=${developerId}&reference-id=${referenceId}`
}
export const fetchUser = async (accountIdentifier: string): Promise<any> => {
    const response = await fetch(`/api/peanut/user/fetch-user?accountIdentifier=${accountIdentifier}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (response.status === 404) {
        return undefined
    }

    const data = await response.json()
    return data
}

export const createUser = async (
    bridgeCustomerId: string,
    email: string,
    fullName: string,
    physicalAddress?: {
        street_line_1: string
        city: string
        country: string
        state: string
        postal_code: string
    },
    userDetails?: any
): Promise<any> => {
    const response = await fetch('/api/peanut/user/create-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bridgeCustomerId,
            email,
            fullName,
            physicalAddress,
            userDetails,
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to create user')
    }

    const data = await response.json()
    return data
}

export const createAccount = async (
    userId: string,
    bridgeCustomerId: string,
    bridgeAccountId: string,
    accountType: string,
    accountIdentifier: string,
    accountDetails: any
): Promise<any> => {
    const response = await fetch('/api/peanut/user/add-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId,
            bridgeCustomerId,
            bridgeAccountId,
            accountType,
            accountIdentifier,
            accountDetails,
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to create account')
    }

    const data = await response.json()
    return data
}

export async function fetchApi(url: string, method: string, body?: any): Promise<any> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url}`)
    }

    return await response.json()
}

export async function getUserLinks(formData: consts.IOfframpForm) {
    console.log('formData', formData)
    return await fetchApi('/api/bridge/user/new/get-links', 'POST', {
        type: 'individual',
        full_name: formData.name,
        email: formData.email,
    })
}

export async function getStatus(userId: string, type: string) {
    return await fetchApi('/api/bridge/user/new/get-status', 'POST', {
        userId,
        type,
    })
}

export async function getCustomer(customerId: string) {
    return await fetchApi('/api/bridge/get-user-by-id', 'POST', {
        customerId,
    })
}

export async function getExternalAccounts(customerId: string) {
    return await fetchApi('/api/bridge/external-account/get-all-for-customerId', 'POST', {
        customerId,
    })
}

export async function awaitStatusCompletion(
    userId: string,
    type: string,
    initialStatus: string,
    link: string,
    setTosLinkOpened: Function,
    setKycLinkOpened: Function,
    tosLinkOpened: boolean,
    kycLinkOpened: boolean
) {
    let status = initialStatus

    // if (type === 'tos' && !tosLinkOpened) {
    //     window.open(link, '_blank')
    //     setTosLinkOpened(true)
    // } else if (type === 'kyc' && !kycLinkOpened) {
    //     window.open(link, '_blank')
    //     setKycLinkOpened(true)
    // }

    while (status !== 'approved') {
        const statusData = await getStatus(userId, type)
        status = statusData[`${type}_status`]

        if (status === 'under_review') {
            if (type === 'tos') throw new Error('TOS is under review')
            else if (type === 'kyc') throw new Error('KYC is under review.')
        } else if (status !== 'approved') {
            await new Promise((resolve) => setTimeout(resolve, 5000)) // wait 5 seconds before checking again
        }
    }
}

export async function createExternalAccount(
    customerId: string,
    accountType: 'iban' | 'us',
    accountDetails: any,
    address: any,
    accountOwnerName: string
): Promise<interfaces.IBridgeAccount> {
    try {
        console.log({
            customerId,
            accountType,
            accountDetails,
            address,
            accountOwnerName,
        })
        const response = await fetch(`/api/bridge/external-account/create-external-account?customerId=${customerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountType,
                accountDetails,
                address: address ? address : {},
                accountOwnerName,
            }),
        })

        if (!response.ok) {
            console.log(response)
            throw new Error('Failed to create external account')
        }

        const data = await response.json()

        console.log('External account created:', data)
        return data as interfaces.IBridgeAccount
    } catch (error) {
        console.error('Error:', error)
        throw new Error(`Failed to create external account. Error: ${error}`)
    }
}

export const validateAccountFormData = async (formData: any, setAccountFormError: any) => {
    let isValid = true
    if (!formData.accountNumber) {
        setAccountFormError('accountNumber', { type: 'required', message: 'Account number is required' })
        console.log('Account number is required')
        isValid = false
    }

    if (formData.type === 'iban') {
        if (!formData.BIC) {
            setAccountFormError('BIC', { type: 'required', message: 'BIC is required' })
            console.log('BIC is required')
            isValid = false
        }
        const isValidBic = await utils.validateBic(formData.BIC)

        if (!isValidBic) {
            setAccountFormError('BIC', {
                type: 'invalid',
                message: 'BIC not accepted, please get in contact via discord',
            })
            console.log('Invalid BIC')
            isValid = false
        }
    } else if (formData.type === 'us') {
        if (!formData.routingNumber) {
            setAccountFormError('routingNumber', { type: 'required', message: 'Routing number is required' })
            console.log('Routing number is required')
            isValid = false
        }
        if (!formData.street) {
            setAccountFormError('street', { type: 'required', message: 'Street is required' })
            console.log('Street is required')
            isValid = false
        }
        if (!formData.city) {
            setAccountFormError('city', { type: 'required', message: 'City is required' })
            console.log('City is required')
            isValid = false
        }
        if (!formData.country) {
            setAccountFormError('country', { type: 'required', message: 'Country is required' })
            console.log('Country is required')
            isValid = false
        }
        if (!formData.postalCode) {
            setAccountFormError('postalCode', { type: 'required', message: 'Postal code is required' })
            console.log('Postal code is required')
            isValid = false
        }
        if (!formData.state) {
            setAccountFormError('state', { type: 'required', message: 'State is required' })
            console.log('State is required')
            isValid = false
        }
    }

    return isValid
}

export const createLiquidationAddress = async (
    customerId: string,
    chainName: string,
    tokenName: string,
    externalAccountId: string,
    destinationPaymentRail: string,
    destinationCurrency: string
): Promise<interfaces.IBridgeLiquidationAddress> => {
    const response = await fetch('/api/bridge/liquidation-address/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            customer_id: customerId,
            chain: chainName,
            currency: tokenName,
            external_account_id: externalAccountId,
            destination_payment_rail: destinationPaymentRail,
            destination_currency: destinationCurrency,
        }),
    })

    if (!response.ok) {
        console.log(response)
        throw new Error('Failed to create liquidation address')
    }

    const data: interfaces.IBridgeLiquidationAddress = await response.json()

    return data
}

export const getLiquidationAddresses = async (customerId: string): Promise<interfaces.IBridgeLiquidationAddress[]> => {
    console.log('customerId', customerId)
    const response = await fetch(`/api/bridge/liquidation-address/get-all?customerId=${customerId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch liquidation addresses')
    }

    const data: interfaces.IBridgeLiquidationAddress[] = await response.json()
    return data
}

export function getThreeCharCountryCodeFromIban(iban: string): string {
    if (!iban || typeof iban !== 'string' || iban.length < 2) {
        throw new Error('Invalid IBAN')
    }

    const twoCharCountryCode = iban.substring(0, 2).toUpperCase()
    const threeCharCountryCode = countries.alpha2ToAlpha3(twoCharCountryCode)

    if (!threeCharCountryCode) {
        throw new Error('Invalid country code in IBAN')
    }

    return threeCharCountryCode
}

export function getBridgeTokenName(chainId: string, tokenAddress: string): string | undefined {
    const token = consts.supportedBridgeTokensDictionary
        .find((chain) => chain.chainId === chainId)
        ?.tokens.find((token) => utils.compareTokenAddresses(token.address, tokenAddress))
        ?.token.toLowerCase()

    return token ?? undefined
}

export function getBridgeChainName(chainId: string): string | undefined {
    const chain = consts.supportedBridgeChainsDictionary.find((chain) => chain.chainId === chainId)?.chain
    return chain ?? undefined
}

export function getTokenAddressFromBridgeTokenName(chainId: string, tokenName: string): string | undefined {
    const token = consts.supportedBridgeTokensDictionary
        .find((chain) => chain.chainId === chainId)
        ?.tokens.find((token) => token.token === tokenName.toLowerCase())?.address

    return token ?? undefined
}
export function getChainIdFromBridgeChainName(chainName: string): string | undefined {
    const chain = consts.supportedBridgeChainsDictionary.find((chain) => chain.chain === chainName)?.chainId
    return chain ?? undefined
}

export async function validateBankAccount(bankAccount: string): Promise<boolean> {
    const response = await fetch(`/api/peanut/iban/validate-bank-account`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bankAccount,
        }),
    })

    if (response.status !== 200) {
        return false
    }

    const { valid } = await response.json()

    return valid
}

export async function validateBic(bic: string): Promise<boolean> {
    const response = await fetch(`/api/peanut/iban/validate-bic`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            bic,
        }),
    })

    if (response.status !== 200) {
        return false
    }

    const { valid } = await response.json()

    return valid
}
