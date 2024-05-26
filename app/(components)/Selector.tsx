import { FC, useEffect, useState } from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { ALPHA, BETA, DEFAULT_VALUE } from '../utils/SupportedCoins';

interface MenuItem {
    key: string;
    name: string;
};

interface SelectorProps {
    defaultValue: string;
    ignoreValue: string;
    setCoin: (coin: string) => void;
    id: string;
};

const Selector: FC<SelectorProps> = ({ defaultValue, ignoreValue, setCoin, id }) => {
    const menu: MenuItem[] = [
        { key: ALPHA, name: ALPHA },
        { key: BETA, name: BETA },
    ]

    const [selectedItem, setSelectedItem] = useState<string>(defaultValue);
    const [menuItems, setMenuItems] = useState<MenuItem[]>(getFilteredItems(ignoreValue));

    function getFilteredItems(ignoreValue: string): MenuItem[] {
        return menu.filter(item => item['key'] !== ignoreValue)
    }

    useEffect(() => {
        setSelectedItem(defaultValue)
    }, [defaultValue])

    useEffect(() => {
        setMenuItems(getFilteredItems(ignoreValue))
    }, [ignoreValue])

    return (
        <Dropdown className="min-w-0 w-fit" placement="bottom-end">
        <DropdownTrigger
            style={{
            backgroundColor:
                selectedItem === DEFAULT_VALUE ? '#25fff2' : '#091a1f',
            color: selectedItem === DEFAULT_VALUE ? '#091a1f' : '#25fff2',
            }}
        >
            <Button className='text-white px-8' endContent={<ArrowDropDownIcon />}>
                {selectedItem}
            </Button>
        </DropdownTrigger>
        <DropdownMenu
            aria-label='Dynamic Actions'
            items={menuItems}
            onAction={key => {
                setSelectedItem(key as string)
                setCoin(key as string)
            }}
        >
            {item => (
                <DropdownItem
                    aria-label={id}
                    key={item.key}
                    color={item.key === 'delete' ? 'danger' : 'default'}
                    className='text-black'
                >
                    {item.name}
                </DropdownItem>
            )}
        </DropdownMenu>
        </Dropdown>
    )
}

export default Selector;