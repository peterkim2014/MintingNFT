import React, { useState } from 'react';
import './App.css';
import WalletConnector from './components/WalletConnector';
import NFTMinter from './components/NFTMinter';

function App() {
  const [account, setAccount] = useState(null); // State to store the connected account
  const [provider, setProvider] = useState(null); // State to store the provider

  return (
    <div className="App">
      <h1>Mint Your NFT (Testing Network Only)</h1>
      <WalletConnector setAccount={setAccount} setProvider={setProvider} />
      {account && provider && (
        <>
          <p>Your connected account: {account}</p>
          <NFTMinter account={account} provider={provider} />
        </>
      )}
    </div>
  );
}

export default App;
