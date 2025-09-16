import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { XMarkIcon } from './icons/Icons';

interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
    {
        selector: 'body',
        position: 'center',
        title: 'Welcome to StockerZ!',
        content: "Let's take a quick tour to familiarize you with the application's key features. You can use the arrow keys to navigate.",
    },
    {
        selector: '[data-tour-id="sidebar-nav"]',
        position: 'right',
        title: 'Main Navigation',
        content: 'Use the sidebar to navigate between different sections like Inventory, Requests, Vendors, and Admin panels.',
    },
    {
        selector: '[data-tour-id="header-actions"]',
        position: 'bottom',
        title: 'Contextual Actions',
        content: 'This area of the header contains key actions. For example, on the Inventory page, you can add a new product from here.',
    },
    {
        selector: '[data-tour-id="header-user-menu"]',
        position: 'bottom',
        title: 'Your Profile',
        content: 'Click here to access your profile settings or to log out of the application.',
    },
    {
        selector: '[data-tour-id="main-content-area"]',
        position: 'top',
        title: 'Main Content Area',
        content: "This is where all the information is displayed, from dashboards and charts to lists of your products and vendors.",
    },
    {
        selector: 'body',
        position: 'center',
        title: "You're all set!",
        content: "That's a quick overview of StockerZ. Feel free to explore and manage your inventory.",
    }
];

interface OnboardingTourProps {
    isActive: boolean;
    onEndTour: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isActive, onEndTour }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const currentStep = TOUR_STEPS[stepIndex];

    useLayoutEffect(() => {
        if (!isActive || !currentStep) return;

        const targetElement = document.querySelector(currentStep.selector);
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetRect(rect);
        } else {
            setTargetRect(null); // for 'center'
        }
    }, [stepIndex, currentStep, isActive]);

    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'Escape') {
                handleEndTour();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, stepIndex]);

    const handleNext = () => {
        if (stepIndex < TOUR_STEPS.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleEndTour();
        }
    };

    const handlePrev = () => {
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
        }
    };

    const handleEndTour = () => {
        setStepIndex(0); // Reset for next time
        onEndTour();
    };

    if (!isActive) return null;

    const tooltipStyle: React.CSSProperties = {};
    if (targetRect && tooltipRef.current) {
        const tooltipHeight = tooltipRef.current.offsetHeight;
        const tooltipWidth = tooltipRef.current.offsetWidth;
        const spacing = 15;

        switch (currentStep.position) {
            case 'bottom':
                tooltipStyle.top = `${targetRect.bottom + spacing}px`;
                tooltipStyle.left = `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`;
                break;
            case 'top':
                tooltipStyle.top = `${targetRect.top - tooltipHeight - spacing}px`;
                tooltipStyle.left = `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`;
                break;
            case 'left':
                tooltipStyle.top = `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`;
                tooltipStyle.left = `${targetRect.left - tooltipWidth - spacing}px`;
                break;
            case 'right':
                tooltipStyle.top = `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`;
                tooltipStyle.left = `${targetRect.right + spacing}px`;
                break;
            default: // center
                break;
        }
    }

    const isCentered = currentStep.position === 'center';

    return (
        <div className="fixed inset-0 z-[1000]">
            {/* Highlighter */}
            {!isCentered && targetRect && (
                <div
                    className="absolute bg-white transition-all duration-300 ease-in-out pointer-events-none rounded-lg"
                    style={{
                        top: targetRect.top - 5,
                        left: targetRect.left - 5,
                        width: targetRect.width + 10,
                        height: targetRect.height + 10,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    }}
                ></div>
            )}
            
             {/* Overlay for centered steps */}
            {isCentered && <div className="fixed inset-0 bg-black bg-opacity-65 transition-opacity duration-300"></div>}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className={`absolute bg-white rounded-lg shadow-2xl p-5 w-80 z-[1001] transition-all duration-300 ease-in-out ${isCentered ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                style={tooltipStyle}
            >
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{currentStep.title}</h3>
                    <button onClick={handleEndTour} className="p-1 -mr-2 -mt-2 text-slate-400 hover:text-slate-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-slate-600 text-sm">{currentStep.content}</p>

                <div className="flex justify-between items-center mt-5">
                    <span className="text-xs text-slate-500 font-semibold">{stepIndex + 1} / {TOUR_STEPS.length}</span>
                    <div className="flex gap-2">
                        {stepIndex > 0 && (
                            <button onClick={handlePrev} className="px-4 py-1.5 text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-md">
                                Previous
                            </button>
                        )}
                        <button onClick={handleNext} className="px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md">
                            {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OnboardingTour;
