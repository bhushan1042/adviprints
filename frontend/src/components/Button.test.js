import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from './Button';

test('Test button click', ()=> {
    render(<Button label="Click it here" />);
    expect(screen.getByText('Click it here')).toBeInTheDocument();
});

test('calls onClick function when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label="Click it here" onClick={handleClick} />);

    const button = screen.getByText('Click it here');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
});