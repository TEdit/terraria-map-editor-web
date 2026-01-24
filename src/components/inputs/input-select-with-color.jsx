import React, { useState, useRef, useEffect } from "react";

import { ArrowDownIcon } from "../icon.jsx";
import { toCssColor } from "../../utils/colorUtils.js";
import "./input-select-with-color.css";

function InputSelectWithColor({
    label,
    options,
    value,
    onChange,
    className,
    width,
    disabled
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const dropdownRef = useRef(null);
    const optionsRef = useRef([]);

    // Find the selected option
    const selectedOption = options.find(opt => {
        const optValue = Array.isArray(opt) ? opt[1] : opt;
        return optValue == value;
    });

    // Handle missing option (not in list)
    let missingOption = null;
    if (value && value !== "null" && !selectedOption) {
        missingOption = value;
    }

    // Get display label and color for selected option
    const getOptionData = (opt) => {
        if (!opt) return { label: '', color: null };
        if (Array.isArray(opt)) {
            return {
                label: opt[0],
                value: opt[1],
                color: opt[2] || null
            };
        }
        return { label: opt, value: opt, color: null };
    };

    const selectedData = selectedOption
        ? getOptionData(selectedOption)
        : missingOption
            ? { label: missingOption, value: missingOption, color: null }
            : getOptionData(options[0]);

    const selectedCssColor = toCssColor(selectedData.color);

    // Toggle dropdown
    const toggleDropdown = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Find current selection index
            const currentIndex = options.findIndex(opt => {
                const optValue = Array.isArray(opt) ? opt[1] : opt;
                return optValue == value;
            });
            setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    };

    // Select an option
    const selectOption = (opt) => {
        const optData = getOptionData(opt);
        onChange(optData.value);
        setIsOpen(false);
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setIsOpen(true);
                const currentIndex = options.findIndex(opt => {
                    const optValue = Array.isArray(opt) ? opt[1] : opt;
                    return optValue == value;
                });
                setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, options.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < options.length) {
                    selectOption(options[focusedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Auto-scroll focused item into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
            optionsRef.current[focusedIndex].scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [focusedIndex, isOpen]);

    return (
        <div className={`input-container ${className ?? ""}`}>
            {label && <span className="input-label">{label}:</span>}
            <div
                className="input-select-with-color-container"
                ref={dropdownRef}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                style={width ? { minWidth: width } : undefined}
            >
                <div
                    className={`select-header ${disabled ? '--disabled' : ''}`}
                    onClick={toggleDropdown}
                >
                    <span className="select-label">{selectedData.label}</span>
                    {selectedCssColor && (
                        <div
                            className="select-color-box"
                            style={{ background: selectedCssColor }}
                        />
                    )}
                    <ArrowDownIcon className="select-arrow" />
                </div>

                {isOpen && (
                    <div className="select-dropdown">
                        {options.map((option, index) => {
                            const optData = getOptionData(option);
                            const cssColor = toCssColor(optData.color);
                            const isFocused = index === focusedIndex;

                            return (
                                <div
                                    key={index}
                                    ref={el => optionsRef.current[index] = el}
                                    className={`select-option ${isFocused ? '--focused' : ''}`}
                                    onClick={() => selectOption(option)}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                >
                                    <span className="option-label">{optData.label}</span>
                                    {cssColor && (
                                        <div
                                            className="option-color-box"
                                            style={{ background: cssColor }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {missingOption && (
                            <div className="select-option --missing">
                                <span className="option-label">{missingOption}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default InputSelectWithColor;
