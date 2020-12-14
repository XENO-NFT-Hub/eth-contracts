// const { expectRevert } = require('@openzeppelin/test-helpers');
// const expectEvent = require('./helpers/expectEvent');
const { ZERO_ADDRESS } = require('./helpers/constants');
const { setUpUnitTest } = require('./helpers/setUpUnitTest');

const {
    BN,           // Big Number support
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    time,
    } = require('@openzeppelin/test-helpers');

contract('XNOToken', function (accounts) {

    const [owner, minter, pauser, recoverer, ...others] = accounts;

    const users = others.slice(0,);
    let token;

    let totalsupply = 2100000000;

    beforeEach(async function () {
        const { instances } = await setUpUnitTest(accounts);
        token = instances.XNOToken;
    });

    describe('roles', function(){

        it('set the contract owner as Pauser role', async function () {
            (await token.isPauser(owner, { from: owner })).should.be.equal(true);
        });

        it('set the Pauser role', async function () {
            const { logs } = await token.addPauser(pauser, { from: owner });

            (await token.isPauser(pauser, { from: owner })).should.be.equal(true);

            expectEvent.inLogs(logs, 'PauserAdded', {
                account: pauser,
            });
        });

        it('fails to set the Pauser role if not called by a Pauser', async function () {
            await expectRevert(token.addPauser(users[0], { from: users[0] }), "PauserRole: caller does not have the Pauser role");
        });

        it('renounce the Pauser role', async function () {
            await token.addPauser(pauser, { from: owner });
            const { logs } = await token.renouncePauser({ from: owner });

            (await token.isPauser(owner, { from: owner })).should.be.equal(false);

            expectEvent.inLogs(logs, 'PauserRemoved', {
                account: owner,
            });
        });

        it('fails to renounce the Pauser role if there are no other Pauser accounts', async function () {
            await expectRevert(token.renouncePauser({ from: owner }), "Roles: there must be at least one account assigned to this role");
        });

        it('set the contract owner as Recoverer role', async function () {
            (await token.isRecoverer(owner, { from: owner })).should.be.equal(true);
        });

        it('set the Recoverer role', async function () {
            const { logs } =  await token.addRecoverer(recoverer, { from: owner });

            (await token.isRecoverer(recoverer, { from: owner })).should.be.equal(true);

            expectEvent.inLogs(logs, 'RecovererAdded', {
                account: recoverer,
            });
        });

        it('fails to set the Recoverer role if not called by a Recoverer', async function () {
            await expectRevert(token.addRecoverer(users[0], { from: users[0] }), "RecovererRole: caller does not have the Recoverer role");
        });

        it('renounce the Recoverer role', async function () {
            await token.addRecoverer(recoverer, { from: owner });
            const { logs } = await token.renounceRecoverer({ from: owner });

            (await token.isRecoverer(owner, { from: owner })).should.be.equal(false);

            expectEvent.inLogs(logs, 'RecovererRemoved', {
                account: owner,
            });
        });

        it('fails to renounce the Recoverer role if there are no other Recoverer accounts', async function () {
            await expectRevert(token.renounceRecoverer({ from: owner }), "Roles: there must be at least one account assigned to this role");
        });
    });

    describe('total supply', function () {
        it('returns the total supply of tokens', async function () {
            (await token.totalSupply()).should.be.bignumber.equal(web3.utils.toWei(new BN(totalsupply)));
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                (await token.balanceOf(users[0])).should.be.bignumber.equal(new BN(0));
            });
        });

        describe('when the owner account creates the contract', function () {
            it('returns the total amount of tokens', async function () {
                (await token.balanceOf(owner)).should.be.bignumber.equal(web3.utils.toWei(new BN(totalsupply)));
            });
        });
    });

    describe('transfer', function () {
        describe('when the recipient is not the zero address', function () {
            const to = users[0];

            describe('when the sender does not have enough balance', function () {
                const amount = web3.utils.toWei(new BN(totalsupply+1));

                it('reverts', async function () {
                    await expectRevert(token.transfer(to, amount, { from: owner }), "ERC20: transfer amount exceeds balance");
                });
            });

            describe('when the sender has enough balance', function () {
                const amount = web3.utils.toWei(new BN(totalsupply-100));

                it('transfers the requested amount', async function () {
                    const { logs } = await token.transfer(to, amount, { from: owner });

                    (await token.balanceOf(owner)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
                    (await token.balanceOf(to)).should.be.bignumber.equal(amount);

                    expectEvent.inLogs(logs, 'Transfer', {
                        from: owner,
                        to: to,
                        value: amount,
                    });
                });
            });

            describe('when the recipient is the zero address', function () {
                const to = ZERO_ADDRESS;

                it('reverts', async function () {
                    await expectRevert(token.transfer(to, web3.utils.toWei(new BN(100)), { from: owner }), "ERC20: transfer to the zero address");
                });
            });
        });
    });

    describe('approve', function () {
        describe('when the spender is not the zero address', function () {
            const spender = users[0];

            describe('when the owner has enough balance', function () {
                const amount = web3.utils.toWei(new BN(totalsupply-100));

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        const { logs } = await token.approve(spender, amount, { from: owner });
                        
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: owner,
                            spender: spender,
                            value: amount,
                        });
                    });
                });

                describe('when the spender had an approved amount', function () {
                    it('approves the requested amount and replaces the previous one', async function () {
                        await token.approve(spender, amount, { from: owner });
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                        await token.approve(spender, web3.utils.toWei(new BN(1)), { from: owner });
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(1)));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = web3.utils.toWei(new BN(totalsupply+1));

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        const { logs } =  await token.approve(spender, amount, { from: owner });

                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: owner,
                            spender: spender,
                            value: amount,
                        });
                    });
                });

                describe('when the spender had an approved amount', function () {
                    it('approves the requested amount and replaces the previous one', async function () {
                        await token.approve(spender, amount, { from: owner });
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                        await token.approve(spender, web3.utils.toWei(new BN(1)), { from: owner });
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(1)));
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;
            const amount = web3.utils.toWei(new BN(totalsupply));

            it('reverts', async function () {
                await expectRevert(token.approve(spender, amount, { from: owner }), "ERC20: approve to the zero address");
            });
        });
    });

    describe('transfer from', function () {
      const spender = users[0];

        describe('when the recipient is not the zero address', function () {
            const to = users[1];

            describe('when the spender has enough approved balance', function () {
                beforeEach(async function () {
                    await token.approve(spender, web3.utils.toWei(new BN(totalsupply)), { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = web3.utils.toWei(new BN(totalsupply));

                    it('transfers the requested amount', async function () {
                        const { logs } = await token.transferFrom(owner, to, amount, { from: spender });

                        (await token.balanceOf(owner)).should.be.bignumber.equal(new BN(0));
                        (await token.balanceOf(to)).should.be.bignumber.equal(amount);

                        expectEvent.inLogs(logs, 'Transfer', {
                            from: owner,
                            to: to,
                            value: amount,
                        });
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = web3.utils.toWei(new BN(totalsupply));
                    
                    it('reverts', async function () {
                        (await token.balanceOf(owner)).should.be.bignumber.equal(amount);
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                        await token.transfer(to, web3.utils.toWei(new BN(100)), {from: owner});
                        await expectRevert(token.transferFrom(owner, to, amount, { from: spender }), "ERC20: transfer amount exceeds balance");
                    });
                });
            });

            describe('when the spender does not have enough approved balance', function () {
                beforeEach(async function () {
                    await token.approve(spender, web3.utils.toWei(new BN(1)), { from: owner });
                });

                describe('when the owner has enough balance', function () {
                    const amount = web3.utils.toWei(new BN(totalsupply));

                    it('reverts', async function () {
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(1)));
                        await expectRevert(token.transferFrom(owner, to, amount, { from: spender }), "ERC20: transfer amount exceeds allowance");
                    });
                });

                describe('when the owner does not have enough balance', function () {
                    const amount = web3.utils.toWei(new BN(1));

                    it('reverts', async function () {
                        (await token.balanceOf(owner)).should.be.bignumber.equal(web3.utils.toWei(new BN(totalsupply)));
                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                        await token.transfer(to, web3.utils.toWei(new BN(totalsupply)), {from: owner});
                        await expectRevert(token.transferFrom(owner, to, amount, { from: spender }), "ERC20: transfer amount exceeds balance");
                    });
                });
            });
        });

        describe('when the recipient is the zero address', function () {
            const amount = web3.utils.toWei(new BN(totalsupply));
            const to = ZERO_ADDRESS;

            beforeEach(async function () {
                await token.approve(spender, amount, { from: owner });
            });

            it('reverts', async function () {
                await expectRevert(token.transferFrom(owner, to, amount, { from: spender }), "ERC20: transfer to the zero address");
            });
        });
    });

    describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
            const spender = users[0];

            describe('when there was no approved amount before', function () {
                const amount = web3.utils.toWei(new BN(1));
                it('reverts', async function () {
                    await expectRevert(token.decreaseAllowance(spender, amount, { from: owner }), "ERC20: decreased allowance below zero");
                });
            });

            describe('when the spender had an approved amount', function () {
                const amount = web3.utils.toWei(new BN(totalsupply));
                beforeEach(async function () {
                    await token.approve(spender, amount, { from: owner });
                });

                it('decreases the spender allowance subtracting the requested amount', async function () {
                    (await token.balanceOf(owner)).should.be.bignumber.equal(web3.utils.toWei(new BN(totalsupply)));
                    (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    const { logs } = await token.decreaseAllowance(spender, amount.sub(web3.utils.toWei(new BN(1))), { from: owner });

                    (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(1)));

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: owner,
                        spender: spender,
                        value: web3.utils.toWei(new BN(1)),
                    });
                });

                it('sets the allowance to zero when all allowance is removed', async function () {
                    await token.decreaseAllowance(spender, amount, { from: owner });

                    (await token.allowance(owner, spender)).should.be.bignumber.equal(new BN(0));
                });

                it('reverts when more than the full allowance is removed', async function () {
                    await expectRevert(token.decreaseAllowance(spender, amount.add(web3.utils.toWei(new BN(1))), { from: owner }), "ERC20: decreased allowance below zero");
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(token.decreaseAllowance(spender, new BN(0), { from: owner }), "ERC20: approve to the zero address");
            });
        });
    });

    describe('increase allowance', function () {
        const amount = web3.utils.toWei(new BN(totalsupply));

        describe('when the spender is not the zero address', function () {
            const spender = users[0];

            describe('when the sender has enough balance', function () {

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await token.increaseAllowance(spender, amount, { from: owner });

                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await token.approve(spender, web3.utils.toWei(new BN(1)), { from: owner });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        const { logs } = await token.increaseAllowance(spender, amount, { from: owner });

                        (await token.allowance(owner, spender)).should.be.bignumber.equal(amount.add(web3.utils.toWei(new BN(1))));

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: owner,
                            spender: spender,
                            value: amount.add(web3.utils.toWei(new BN(1))).toString(),
                        });
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(token.increaseAllowance(spender, new BN(0), { from: owner }), "ERC20: approve to the zero address");
            });
        });
    });

    describe('burn', function () {
        const amount = web3.utils.toWei(new BN(totalsupply));

        describe('when the burner has enough balance', function () {
            it('burns the requested amount', async function () {
                const burnAmount = web3.utils.toWei(new BN(1));
                const { logs } = await token.burn(burnAmount, { from: owner });
                // check balance
                (await token.balanceOf(owner)).should.be.bignumber.equal(amount.sub(burnAmount));
                // check total supply
                (await token.totalSupply()).should.be.bignumber.equal(amount.sub(burnAmount)); 

                // event
                expectEvent.inLogs(logs, 'Transfer', {
                    from: owner,
                    to: ZERO_ADDRESS,
                    value: burnAmount.toString(),
                });
            });
        });

        describe('when the burner does not have enough balance', function () {
            it('reverts', async function () {
                const burnAmount = amount.add(web3.utils.toWei(new BN(1)));
                await expectRevert(token.burn(burnAmount, { from: owner }), "ERC20: burn amount exceeds balance");
            });
        });
    });

    describe('burn from', function () {
        const spender = users[0];
        const amount = web3.utils.toWei(new BN(totalsupply));

        describe('when the owner has enough balance', function () {
            describe('when there is enough approved amount', function () {
                beforeEach(async function () {
                    await token.approve(spender, amount, { from: owner });
                });

                it('burns the requested amount', async function () {
                    const burnAmount = web3.utils.toWei(new BN(1));
                    const { logs } = await token.burnFrom(owner, burnAmount, { from: spender });
                    // check balance
                    (await token.balanceOf(owner)).should.be.bignumber.equal(amount.sub(burnAmount));
                    // check total supply
                    (await token.totalSupply()).should.be.bignumber.equal(amount.sub(burnAmount)); 
                    // event
                    expectEvent.inLogs(logs, 'Transfer', {
                        from: owner,
                        to: ZERO_ADDRESS,
                        value: burnAmount.toString(),
                    });
                });
            });

            describe('when there is not enough approved amount', function () {
                beforeEach(async function () {
                    await token.approve(spender, web3.utils.toWei(new BN(1)), { from: owner });
                });

                it('reverts', async function () {
                    const burnAmount = web3.utils.toWei(new BN(100));
                    await expectRevert(token.burnFrom(owner, burnAmount, { from: spender }), "ERC20: burn amount exceeds allowance");
                });
            });
        });

        describe('when the owner does not have enough balance', function () {
            describe('when there is enough approved amount', function () {
                beforeEach(async function () {
                    await token.approve(spender, amount, { from: owner });
                });
                it('reverts', async function () {
                    const burnAmount = web3.utils.toWei(new BN(totalsupply+1));
                    await expectRevert(token.burnFrom(owner, burnAmount, { from: spender }), "ERC20: burn amount exceeds balance");
                });
            });
        });
    });

    describe('pause', function () {
        describe('when the contract is unpaused', function () {
            const spender = users[0];
            const amount = web3.utils.toWei(new BN(totalsupply-100));

            before(async function () {
                (await token.paused()).should.be.equal(false);
            });

            it('transfers the requested amount', async function () {
                await token.transfer(spender, amount, { from: owner });

                (await token.balanceOf(owner)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
                (await token.balanceOf(spender)).should.be.bignumber.equal(amount);
            });

            it('approves the requested amount', async function () {
                await token.approve(spender, web3.utils.toWei(new BN(100)), { from: owner });

                (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
            });

            it('increases allowance for the requested amount', async function () {
                await token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });

                (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
            });

            it('decreases allowance for the requested amount', async function () {
                await token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });
                await token.decreaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });

                (await token.allowance(owner, spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(0)));
            });

            it('transfer from the requested amount', async function () {
                await token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });
                await token.transferFrom(owner, spender, web3.utils.toWei(new BN(100)), { from: spender });

                (await token.balanceOf(owner)).should.be.bignumber.equal(amount);
                (await token.balanceOf(spender)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
            });
            
            it('burns the requested amount', async function () {
                await token.burn(web3.utils.toWei(new BN(100)), { from: owner });

                (await token.balanceOf(owner)).should.be.bignumber.equal(amount);
                (await token.totalSupply()).should.be.bignumber.equal(amount);
            });

            it('burn from the requested amount', async function () {
                await token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });
                await token.burnFrom(owner, web3.utils.toWei(new BN(100)), { from: spender });

                (await token.balanceOf(owner)).should.be.bignumber.equal(amount);
                (await token.totalSupply()).should.be.bignumber.equal(amount);
            });
        });

        describe('when the contract is paused', function () {
            const spender = users[0];

            beforeEach(async function () {
                // increase allowance, to test decreaseAllowance
                await token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner });
                // pause
                await token.pause({ from: owner });
                (await token.paused()).should.be.equal(true);
            });

            it('reverts transfer', async function () {
                await expectRevert(token.transfer(spender, web3.utils.toWei(new BN(100)), { from: owner }), "Pausable.whenNotPaused: paused");
            });

            it('reverts approve', async function () {
                await expectRevert(token.approve(spender, web3.utils.toWei(new BN(100)), { from: owner }), "Pausable.whenNotPaused: paused");
            });

            it('reverts increaseAllowance', async function () {
                await expectRevert(token.increaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner }), "Pausable.whenNotPaused: paused");
            });

            it('reverts decreaseAllowance', async function () {
                await expectRevert(token.decreaseAllowance(spender, web3.utils.toWei(new BN(100)), { from: owner }), "Pausable.whenNotPaused: paused");
            });

            it('reverts transferFrom', async function () {
                await expectRevert(token.transferFrom(owner, spender, web3.utils.toWei(new BN(100)), { from: spender }), "Pausable.whenNotPaused: paused");
            });

            it('reverts burn', async function () {
                await expectRevert(token.burn(web3.utils.toWei(new BN(100)), { from: owner }), "Pausable.whenNotPaused: paused");
            });

            it('reverts burnFrom', async function () {
                await expectRevert(token.burnFrom(owner, web3.utils.toWei(new BN(100)), { from: spender }), "Pausable.whenNotPaused: paused");
            });
        });
    });

    describe('recover', function () {
        it('recovers the tokens sent to the XNOToken address', async function () {
            const amount = web3.utils.toWei(new BN(totalsupply));
            // send token to contract address
            await token.transfer(token.address, web3.utils.toWei(new BN(100)), { from: owner });
            // check balances
            (await token.balanceOf(owner)).should.be.bignumber.equal(amount.sub(web3.utils.toWei(new BN(100))));
            (await token.balanceOf(token.address)).should.be.bignumber.equal(web3.utils.toWei(new BN(100)));
            // recover
            await token.recoverERC20(token.address, web3.utils.toWei(new BN(100)), { from: owner });
            // check after recovery balances
            (await token.balanceOf(owner)).should.be.bignumber.equal(amount);
            (await token.balanceOf(token.address)).should.be.bignumber.equal(web3.utils.toWei(new BN(0)));
        });
    });
});