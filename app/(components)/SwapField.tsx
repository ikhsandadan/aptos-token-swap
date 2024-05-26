import { forwardRef } from 'react';
import Selector from './Selector';

interface SwapFieldProps {
    obj: {
        id: string;
        value?: string;
        setValue: (value: string) => void;
        defaultValue: string;
        setCoin: (coin: string) => void;
        ignoreValue: string;
    };
};

const SwapField = forwardRef<HTMLInputElement, SwapFieldProps>(({ obj }, inputRef) => {
    const { id, value = '', setValue, defaultValue, setCoin, ignoreValue } = obj;

    return (
        <div className="flex items-center rounded-xl">
        <input
            ref={inputRef}
            className={getInputClassname()}
            type="number"
            value={value}
            placeholder="0"
            onChange={(e) => {
            setValue(e.target.value);
            }}
        />

        <Selector
            id={id}
            setCoin={setCoin}
            defaultValue={defaultValue}
            ignoreValue={ignoreValue}
        />
        </div>
    );

    function getInputClassname() {
        return 'w-full outline-none h-8 px-2 appearance-none text-3xl bg-transparent';
    }
});

SwapField.displayName = 'SwapField';

export default SwapField;
