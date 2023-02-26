import { Worker, NearAccount } from 'near-workspaces';
import anyTest, { TestFn } from 'ava';

const test = anyTest as TestFn<{
  worker: Worker;
  accounts: Record<string, NearAccount>;
}>;

test.beforeEach(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');
  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.worker = worker;
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  // Stop Sandbox server
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

// TODO: Add functiont test
test('Returns default number', async (t) => {
  const { contract } = t.context.accounts;
  const num: number = await contract.view('get_number', {});
  t.is(num,0);
});

test('Increas number', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'increase_number', {});
  const num: number = await contract.view('get_number', {});
  t.is(num,1);
});

test('Decrease number', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'increase_number', {});
  await root.call(contract, 'decrease_number', {});
  const num: number = await contract.view('get_number', {});
  t.is(num,0);
});

test('Payable func with increase 10 units', async (t) => {
  const { root, contract } = t.context.accounts;
  await root.call(contract, 'payable_function', {}, {attachedDeposit: "100"});
  const num: number = await contract.view('get_number', {});
  t.is(num,10);
});


test('Private fn - reset number', async (t) => {
  const { contract } = t.context.accounts;
  await contract.call(contract, 'reset_number', {});
  const num: number = await contract.view('get_number', {});
  t.is(num,0);
});