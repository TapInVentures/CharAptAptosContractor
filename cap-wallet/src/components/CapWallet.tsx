import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button, Input, message as antMessage } from 'antd';

// 合约地址和模块名称
const CONTRACT_ADDRESS = "0x69501c9f7bfbfd62dded3e8f9b63a348b90ba60fd6ee0feacd95e753f5a487e4";
const MODULE_NAME = "cap_token";

// 获取代币余额
const getTokenBalance = async (address: string) => {
  try {
    const response = await fetch(
      `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resource/0x1::coin::CoinStore<${CONTRACT_ADDRESS}::${MODULE_NAME}::CAP>`
    );
    if (response.status === 404) {
      return "0";
    }
    const data = await response.json();
    return data.data.coin.value;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return "0";
  }
};

// 检查代币注册状态
const checkTokenRegistration = async (address: string) => {
  try {
    const response = await fetch(
      `https://fullnode.devnet.aptoslabs.com/v1/accounts/${address}/resources`
    );
    const resources = await response.json();
    return resources.some((resource: any) => 
      resource.type === `0x1::coin::CoinStore<${CONTRACT_ADDRESS}::${MODULE_NAME}::CAP>`
    );
  } catch (error) {
    console.error('Error checking token registration:', error);
    return false;
  }
};

export const CapWallet: React.FC = () => {
  const { account, signAndSubmitTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState("0");

  // 定时刷新余额
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const updateBalance = async () => {
      if (account?.address) {
        const newBalance = await getTokenBalance(account.address);
        setBalance(newBalance);
      }
    };

    if (account?.address) {
      updateBalance(); // 立即执行一次
      intervalId = setInterval(updateBalance, 5000); // 每5秒更新一次
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [account?.address]);

  // 注册代币函数
  const handleRegister = async () => {
    if (!account) {
      antMessage.error('请先连接钱包');
      return;
    }

    try {
      // 先检查是否已注册
      const isRegistered = await checkTokenRegistration(account.address);
      if (isRegistered) {
        antMessage.success('您的钱包已经注册了 CAP 代币');
        return;
      }

      // 如果未注册，则调用注册函数
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::register`,
        type_arguments: [],
        arguments: []
      };

      const response = await signAndSubmitTransaction(payload);
      console.log('Registration submitted:', response);
      antMessage.success('代币注册交易已提交！');
    } catch (error) {
      console.error('Registration Error:', error);
      antMessage.error('代币注册失败：' + (error as Error).message);
    }
  };

  const handleTransfer = async () => {
    if (!account) {
      antMessage.error('请先连接钱包');
      return;
    }

    if (!recipient || !amount) {
      antMessage.error('请输入接收地址和转账金额');
      return;
    }

    try {
      // 先检查接收方是否注册了代币
      const isRegistered = await checkTokenRegistration(recipient);
      if (!isRegistered) {
        antMessage.error('接收地址需要先注册 CAP 代币才能接收转账。请联系接收方先注册代币，或使用管理员钱包进行转账。');
        return;
      }

      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::transfer`,
        type_arguments: [],
        arguments: [recipient, amount]
      };

      const response = await signAndSubmitTransaction(payload);
      console.log('Transaction submitted:', response);
      antMessage.success('转账交易已提交！');
      
      // 清空输入
      setRecipient('');
      setAmount('');
    } catch (error) {
      // 详细打印错误信息
      console.error('Transfer Error:', {
        error,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        recipient,
        amount,
        contractAddress: CONTRACT_ADDRESS,
        moduleName: MODULE_NAME
      });

      const errorMessage = (error as Error).message;
      if (errorMessage.includes("Account hasn't registered")) {
        antMessage.error('接收地址需要先注册 CAP 代币才能接收转账。请联系接收方先注册代币，或使用管理员钱包进行转账。');
      } else {
        antMessage.error('转账失败：' + errorMessage);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>CAP 代币转账</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>当前钱包地址: {account?.address || '未连接'}</p>
        <p>CAP 代币余额: {balance}</p>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          onClick={handleRegister}
          disabled={!account}
          style={{ marginBottom: '16px' }}
          block
        >
          注册 CAP 代币
        </Button>
        <Input
          placeholder="接收地址"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          style={{ marginBottom: '16px' }}
        />
        <Input
          placeholder="转账金额"
          value={amount}
          onChange={(e) => {
            // 只允许输入数字
            if (/^\d*$/.test(e.target.value)) {
              setAmount(e.target.value);
            }
          }}
          style={{ marginBottom: '16px' }}
        />
        <Button 
          type="primary" 
          onClick={handleTransfer}
          disabled={!account}
          block
        >
          转账
        </Button>
      </div>
      {message && <div style={{ marginTop: '16px', color: 'red' }}>{message}</div>}
    </div>
  );
}; 