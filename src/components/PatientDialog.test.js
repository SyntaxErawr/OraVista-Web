import { fireEvent, render, screen } from '@testing-library/react';
import PatientDialog from './PatientDialog';

test('dialogs are named, trap keyboard focus and restore focus after closing', () => {
  const close = jest.fn();
  const opener = document.createElement('button');
  document.body.appendChild(opener);
  opener.focus();
  const view = render(<PatientDialog onClose={close}><div><h2>Confirm appointment</h2><button>Keep editing</button><button>Confirm</button></div></PatientDialog>);
  const dialog = screen.getByRole('dialog', { name: 'Confirm appointment' });
  expect(dialog).toHaveFocus();
  fireEvent.keyDown(dialog, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
  fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
  expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(close).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(opener).toHaveFocus();
  opener.remove();
});

test('Escape does not dismiss a dialog while its request is in progress', () => {
  const close = jest.fn();
  render(<PatientDialog onClose={close} busy><h2>Saving</h2></PatientDialog>);
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(close).not.toHaveBeenCalled();
});
