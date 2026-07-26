import {render, screen} from '@testing-library/react'
import '@testing-library/jest-dom'
import Message from './Message'

test('Check displaying of text', ()=> {
    render(<Message />);
    expect(screen.getByText('This is a static message')).toBeInTheDocument();
})