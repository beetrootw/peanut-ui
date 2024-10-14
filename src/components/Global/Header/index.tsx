'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Box, Flex, Text, Stack, Collapse, useDisclosure } from '@chakra-ui/react'
import { useLottie, LottieOptions } from 'lottie-react'
import Link from 'next/link'
import * as assets from '@/assets'
import * as utils from '@/utils'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { breakpoints, emToPx } from '@/styles/theme'
import { NavItemBox, NavLink } from './components'

const defaultLottieOptions: LottieOptions = {
    animationData: assets.HAMBURGER_LOTTIE,
    loop: true,
    autoplay: false,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
}

const defaultLottieStyle = {
    height: 24,
    width: 24,
}

export const Header = () => {
    const { isOpen, onToggle, onClose } = useDisclosure()
    const [isOpenState, setIsOpenState] = useState<boolean>(false)

    useEffect(() => {
        const handleMediaQueryChange = () => {
            if (window.innerWidth >= emToPx(breakpoints.lg) && isOpen) {
                onClose()
                setIsOpenState(false)
            }
        }

        window.addEventListener('resize', handleMediaQueryChange)

        // Clean up the listener when the component unmounts
        return () => {
            window.removeEventListener('resize', handleMediaQueryChange)
        }
    }, [isOpen, onClose])

    return (
        <NavBarContainer>
            <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'} height={'16'}>
                <Box display={{ base: 'none', lg: 'flex' }} flexDirection={'row'} height="100%">
                    <div
                        className="flex h-full cursor-pointer items-center px-2 font-bold uppercase hover:bg-white hover:text-black"
                        onClick={() => {
                            if (window?.location.pathname == '/') window?.location.reload()
                            else window.location.href = '/'
                        }}
                    >
                        <img src={assets.PEANUTMAN_LOGO.src} alt="logo" className="ml-2 h-6 sm:h-10" />
                        <span className="inline px-2 text-h5 sm:px-6 sm:text-h4">peanut protocol</span>
                    </div>
                    <MenuLinks />
                </Box>
                <Box
                    display={{ base: 'flex', lg: 'none' }}
                    flexDirection={'row'}
                    justifyContent={'space-between'}
                    alignContent={'center'}
                    width={'100%'}
                    height={'100%'}
                >
                    <div
                        className="flex h-full cursor-pointer items-center px-2 font-bold uppercase hover:bg-white hover:text-black"
                        onClick={() => {
                            if (window?.location.pathname == '/') window?.location.reload()
                            else window.location.href = '/'
                        }}
                    >
                        <img src={assets.PEANUTMAN_LOGO.src} alt="logo" className="ml-2 h-6 " />
                        <span className="inline px-2 text-h5 ">peanut protocol</span>
                    </div>

                    <MenuToggle isOpen={isOpenState} toggle={onToggle} />
                </Box>
                <Box display={{ base: 'none', lg: 'block' }}>
                    <SocialLinks />
                </Box>
            </Flex>
            <Collapse unmountOnExit in={isOpen} animateOpacity className="w-full">
                <MenuLinks />
            </Collapse>
        </NavBarContainer>
    )
}

const MenuToggle = ({ toggle, isOpen }: { toggle: () => void; isOpen: boolean }) => {
    const { View: lottieView, goToAndStop } = useLottie(defaultLottieOptions, defaultLottieStyle)

    return (
        <Flex
            height={'100%'}
            justifyContent={'center'}
            alignContent={'center'}
            alignItems={'center'}
            display={{ base: 'flex', lg: 'none' }}
            onClick={() => {
                toggle()
                goToAndStop(isOpen ? 37 : 0, true)
            }}
            px={2}
        >
            {lottieView}
        </Flex>
    )
}

const MenuLink = ({ route, title, isBeta = false }: { route: string; title: string; isBeta?: boolean }) => {
    const router = useRouter()

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
            e.preventDefault()
            if (window?.location.pathname === route) {
                // Force a hard reload of the current page
                window.location.reload()
            } else {
                // For different routes, use router.push()
                router.push(route)
            }
        },
        [router, route]
    )

    return (
        <NavLink href={route} onClick={handleClick}>
            <Text display="block" className="flex items-center">
                {title}
            </Text>
            {isBeta && (
                <span className="relative top-[-1.5em] ml-1 text-[0.5rem] font-semibold uppercase text-purple-1">
                    BETA
                </span>
            )}
        </NavLink>
    )
}

const ToolsDropdown = () => {
    const [showMenu, setShowMenu] = useState<boolean>(false)

    return (
        <>
            <div className="relative hidden h-full sm:block">
                <NavItemBox>
                    <button
                        onMouseEnter={() => {
                            setShowMenu(true)
                        }}
                        onMouseLeave={() => {
                            setShowMenu(false)
                        }}
                        className="flex h-full w-full items-center justify-start py-2 uppercase sm:w-max sm:justify-center"
                    >
                        tools
                    </button>
                </NavItemBox>
                {showMenu && (
                    <div
                        onMouseEnter={() => {
                            setShowMenu(true)
                        }}
                        onMouseLeave={() => {
                            setShowMenu(false)
                        }}
                        className="absolute left-0 z-10 w-48 origin-top-right bg-black p-0 font-medium uppercase text-white no-underline shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                        <MenuLink route={'/raffle/create'} title={'raffle'} />
                        <MenuLink route={'/batch/create'} title={'batch'} />
                        <MenuLink route={'/refund'} title={'refund'} />
                    </div>
                )}
            </div>
            <div className="relative block h-full w-full sm:hidden">
                <NavItemBox>
                    <button
                        onClick={() => {
                            setShowMenu(!showMenu)
                        }}
                        className="flex h-full w-full items-center justify-start py-2 uppercase sm:w-max sm:justify-center"
                    >
                        <Text display="block"> tools</Text>
                    </button>
                </NavItemBox>
                {showMenu && (
                    <div className="bg-black p-0  font-medium uppercase text-white no-underline shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuLink route={'/raffle/create'} title={'raffle'} />
                        <MenuLink route={'/batch/create'} title={'batch'} />
                        <MenuLink route={'/refund'} title={'refund'} />
                    </div>
                )}
            </div>
        </>
    )
}

const MenuLinks = () => {
    const { open: web3modalOpen } = useWeb3Modal()
    const { address, isConnected } = useAccount()

    return (
        <Stack
            align={{ base: 'start', md: 'center' }}
            justify={{ base: 'center', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            pb={{ base: 4, md: 0 }}
            height="100%"
            gap={0}
        >
            <MenuLink route={'/send'} title={'send'} />
            <MenuLink route={'/request/create'} title={'request'} isBeta />
            <MenuLink route={'/cashout'} title={'cashout'} isBeta />
            <ToolsDropdown />
            <MenuLink route={'https://docs.peanut.to'} title={'docs'} />

            <Box
                display={{
                    base: 'flex',
                    lg: 'none',
                }}
                flexDirection="column"
                width={'100%'}
            >
                <NavItemBox>
                    <Link
                        href={'/profile'}
                        className=" flex h-full w-full items-center justify-start py-2 uppercase sm:hidden sm:w-max sm:justify-center"
                    >
                        <Text display="block"> Profile</Text>
                    </Link>
                </NavItemBox>
                <NavItemBox>
                    <button
                        onClick={() => {
                            web3modalOpen()
                        }}
                        className="flex h-full w-full items-center justify-start py-2 uppercase sm:hidden sm:w-max sm:justify-center"
                    >
                        <Text display="block text-nowrap">
                            {' '}
                            {isConnected ? utils.shortenAddress(address ?? '') : 'Connect'}
                        </Text>
                    </button>
                </NavItemBox>
            </Box>
        </Stack>
    )
}

const SocialLinks = () => {
    const { open: web3modalOpen } = useWeb3Modal()
    const { address, isConnected } = useAccount()

    return (
        <Stack direction={'row'} spacing={2} mr={2}>
            <Link href={'/profile'} className="no-underline">
                <button className="btn btn-large bg-white px-2 ">Profile</button>
            </Link>
            <button
                className="btn btn-large text-nowrap bg-white px-2"
                onClick={() => {
                    web3modalOpen()
                }}
            >
                {isConnected ? utils.shortenAddress(address ?? '') : 'Connect'}
            </button>
        </Stack>
    )
}

const NavBarContainer = ({ children, ...props }: { children: React.ReactNode }) => {
    return (
        <Flex
            as="nav"
            align="center"
            justify="space-between"
            wrap="wrap"
            w="100%"
            bg={{ base: 'black', md: 'black' }}
            color={{ base: 'white', md: 'white' }}
            {...props}
            className="z-[9999] text-h6"
            zIndex={9999} // always on top
        >
            {children}
        </Flex>
    )
}

export default Header
