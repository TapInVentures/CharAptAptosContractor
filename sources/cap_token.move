module 0x69501c9f7bfbfd62dded3e8f9b63a348b90ba60fd6ee0feacd95e753f5a487e4::cap_token {
    use std::signer;
    use std::string;
    use aptos_framework::coin::{Self, MintCapability, BurnCapability, FreezeCapability};
    use aptos_framework::timestamp;
    use aptos_framework::account;

    /// Error when account is not token admin
    const E_NOT_ADMIN: u64 = 1;
    /// Error when burn amount exceeds balance
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    /// Error when release time not reached
    const E_RELEASE_TIME_NOT_REACHED: u64 = 3;

    struct CAP {}

    struct TokenAdmin has key {
        mint_cap: MintCapability<CAP>,
        burn_cap: BurnCapability<CAP>,
        freeze_cap: FreezeCapability<CAP>,
        last_release_timestamp: u64,
    }

    /// Initialize token
    public entry fun initialize(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<CAP>(
            account,
            string::utf8(b"CAP Token"),
            string::utf8(b"CAP"),
            8, // decimals
            true, // monitor_supply
        );
        
        // Register the deployer account to receive tokens
        coin::register<CAP>(account);
        
        // Mint initial supply (100M)
        let coins = coin::mint(100000000, &mint_cap);
        coin::deposit(signer::address_of(account), coins);
        
        // Initialize admin with capabilities
        move_to(account, TokenAdmin {
            mint_cap,
            burn_cap,
            freeze_cap,
            last_release_timestamp: timestamp::now_seconds(),
        });
    }

    /// Register CAP token for an account
    public entry fun register(account: &signer) {
        coin::register<CAP>(account);
    }

    /// Admin register CAP token for an account
    public entry fun admin_register(admin: &signer, to: address) {
        let admin_addr = signer::address_of(admin);
        assert!(exists<TokenAdmin>(admin_addr), E_NOT_ADMIN);
        
        // Register the account to receive tokens
        coin::register<CAP>(admin);
    }

    /// Release 10M tokens annually
    public entry fun release_tokens(admin: &signer) acquires TokenAdmin {
        let admin_addr = signer::address_of(admin);
        let token_admin = borrow_global_mut<TokenAdmin>(admin_addr);
        let current_time = timestamp::now_seconds();
        
        // Check if one year has passed
        assert!(current_time >= token_admin.last_release_timestamp + 31536000, E_RELEASE_TIME_NOT_REACHED);
        
        // Update last release time
        token_admin.last_release_timestamp = current_time;
        
        // Release 10M tokens
        let coins = coin::mint(10000000, &token_admin.mint_cap);
        coin::deposit(admin_addr, coins);
    }

    /// Admin transfer tokens to specified address
    public entry fun admin_transfer(
        admin: &signer,
        to: address,
        amount: u64
    ) acquires TokenAdmin {
        let admin_addr = signer::address_of(admin);
        assert!(exists<TokenAdmin>(admin_addr), E_NOT_ADMIN);

        // First register the admin account if not registered
        if (!coin::is_account_registered<CAP>(admin_addr)) {
            coin::register<CAP>(admin);
        };

        // Then mint tokens to admin
        let token_admin = borrow_global<TokenAdmin>(admin_addr);
        let coins = coin::mint(amount, &token_admin.mint_cap);
        coin::deposit(admin_addr, coins);

        // Finally transfer to recipient
        coin::transfer<CAP>(admin, to, amount);
    }

    /// Admin burn tokens
    public entry fun admin_burn(
        admin: &signer,
        amount: u64
    ) acquires TokenAdmin {
        let admin_addr = signer::address_of(admin);
        let token_admin = borrow_global<TokenAdmin>(admin_addr);
        
        let coins = coin::withdraw<CAP>(admin, amount);
        coin::burn(coins, &token_admin.burn_cap);
    }

    /// Transfer tokens between users
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64
    ) {
        coin::transfer<CAP>(from, to, amount);
    }
} 