module cap_token::cap_token {
    use std::string::{String, Self};
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::coin::CoinStore;

    /// 代币名称
    const NAME: vector<u8> = b"CAP Token";
    /// 代币符号
    const SYMBOL: vector<u8> = b"CAP";
    /// 代币精度
    const DECIMALS: u8 = 8;
    /// 代币总供应量
    const TOTAL_SUPPLY: u64 = 1000000000 * 100000000; // 10亿代币，考虑精度

    /// 代币元数据
    struct TokenMetadata has key {
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64
    }

    /// 代币事件
    struct TokenEvents has key {
        transfer_events: event::EventHandle<TransferEvent>,
        mint_events: event::EventHandle<MintEvent>,
        burn_events: event::EventHandle<BurnEvent>
    }

    /// 转账事件
    struct TransferEvent has drop, store {
        from: address,
        to: address,
        amount: u64
    }

    /// 铸造事件
    struct MintEvent has drop, store {
        to: address,
        amount: u64
    }

    /// 销毁事件
    struct BurnEvent has drop, store {
        from: address,
        amount: u64
    }

    /// 初始化函数
    public entry fun initialize(account: &signer) {
        // 初始化代币元数据
        move_to(account, TokenMetadata {
            name: string::utf8(NAME),
            symbol: string::utf8(SYMBOL),
            decimals: DECIMALS,
            total_supply: TOTAL_SUPPLY
        });

        // 初始化事件句柄
        move_to(account, TokenEvents {
            transfer_events: account::new_event_handle<TransferEvent>(account),
            mint_events: account::new_event_handle<MintEvent>(account),
            burn_events: account::new_event_handle<BurnEvent>(account)
        });

        // 铸造初始代币
        let coin = coin::mint(TOTAL_SUPPLY, &TokenMetadata {
            name: string::utf8(NAME),
            symbol: string::utf8(SYMBOL),
            decimals: DECIMALS,
            total_supply: TOTAL_SUPPLY
        }, &TokenEvents {
            transfer_events: account::new_event_handle<TransferEvent>(account),
            mint_events: account::new_event_handle<MintEvent>(account),
            burn_events: account::new_event_handle<BurnEvent>(account)
        });

        // 将代币存入账户
        coin::deposit(signer::address_of(account), coin);
    }

    /// 转账函数
    public entry fun transfer(from: &signer, to: address, amount: u64) acquires TokenEvents {
        let from_addr = signer::address_of(from);
        let coin = coin::withdraw<Coin<TokenMetadata>>(from_addr, amount);
        coin::deposit(to, coin);

        // 发送转账事件
        let events = borrow_global_mut<TokenEvents>(from_addr);
        event::emit_event(&mut events.transfer_events, TransferEvent {
            from: from_addr,
            to,
            amount
        });
    }

    /// 查询余额
    public fun balance_of(owner: address): u64 {
        coin::balance<Coin<TokenMetadata>>(owner)
    }

    /// 查询总供应量
    public fun total_supply(): u64 {
        TOTAL_SUPPLY
    }
} 