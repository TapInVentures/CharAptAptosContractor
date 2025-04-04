import React from 'react';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { CapWallet } from './components/CapWallet';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import './App.css';

/**
 * CAP Token Contract Info:
 * Contract Address: 0x69501c9f7bfbfd62dded3e8f9b63a348b90ba60fd6ee0feacd95e753f5a487e4
 * Module Name: cap_token
 * Token Name: CAP Token
 * Token Symbol: CAP
 * Decimals: 8
 * Initial Supply: 100,000,000 CAP
 */

function App() {
  return (
    <AptosWalletAdapterProvider plugins={[new PetraWallet()]} autoConnect={true}>
      <div className="App">
        <header className="App-header">
          <h1>CAP Token Wallet</h1>
          <WalletSelector />
          <CapWallet />
        </header>
      </div>
    </AptosWalletAdapterProvider>
  );
}

export default App; 