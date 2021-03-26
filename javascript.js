const BRIDGE_CONTRACT = '0x1f0363606da3211be24f2ddb0258b4d920b663e9' // just demo, not working yet
const WLEO = '0x73a9fb46e228628f8f9bb9004eca4f4f529d3998';
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

async function checkNetworkId(){
  let chainId = parseInt(await ethereum.request({ method: 'eth_chainId' }), 16);
  console.log(`Chain ID: ${chainId}`)
  if (chainId != 1){
    alert('Please connect to Ethereum mainnet. Current network ID: ' + chainId)
  }
}

function prepareInputList(){
  let list;
  //load from Uniswap.json
  for (i in uniswap){
    //make sure it's not WETH
    if (uniswap[i].token0.id == '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'){
      list += `<option value="${uniswap[i].token1.id}:${uniswap[i].token1.decimals}">${uniswap[i].token1.symbol} - ${uniswap[i].token1.id}</option>`
    } else {
      list += `<option value="${uniswap[i].token0.id}:${uniswap[i].token0.decimals}">${uniswap[i].token0.symbol} - ${uniswap[i].token0.id}</option>`
    }
  }
  document.getElementById("input_list").innerHTML = list
}

function prepareOutputList(){
  let list;
  //load from Pancake.json
  for (i in pancake){
    //make sure it's not WBNB
    if (pancake[i].token0.id == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'){
      list += `<option value="${pancake[i].token1.id}">${pancake[i].token1.symbol} - ${pancake[i].token1.id}</option>`
    } else {
      list += `<option value="${pancake[i].token0.id}">${pancake[i].token0.symbol} - ${pancake[i].token0.id}</option>`
    }
  }
  document.getElementById("output_list").innerHTML = list
}

async function callBridge(){
  let e = document.getElementById("input_list");
  let _inputTokenElement = e.options[e.selectedIndex].value
  let _inputToken = _inputTokenElement.split(":")[0]
  let _inputAmount = new BigNumber(document.getElementById("input_amount").value).multiply(Math.pow(10, _inputTokenElement.split(":")[1]).toString()) //add decimal places
  let _minAmountOut = 0
  let _recipient = document.getElementById("recepient").value
  let _outputToken = document.getElementById("output_list").options[e.selectedIndex].value

  const _path = [_inputToken, WETH, WLEO]//since we only support tokens with direct WETH pair, just use [token, weth, wleo]
  const contractObject = new web3.eth.Contract(BRIDGE, BRIDGE_CONTRACT);
  // I just realized, original bridge-js function is missing _outputToken as last parameter
  const contractFunction = contractObject.methods['entrance'](_inputToken, _inputAmount, _minAmountOut, _path, _recipient, _outputToken);
  await callMetamask(contractFunction);
}

async function callMetamask(contractFunction){
  if (typeof window.ethereum !== 'undefined') {
    let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    // Call swap contract
    const functionAbi = contractFunction.encodeABI();
    const transactionParameters = {
      nonce: '0x00', // ignored by MetaMask
      to: BRIDGE_CONTRACT, // Required except during contract publications.
      from: account, // must match user's active address.
      data: functionAbi, // Optional, but used for defining smart contract creation and interaction.
      chainId: 1, // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
      gas: '0x186A0'
    };
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
  } else {
    alert("MetaMask is not installed!")
  }
}

let ethereumButton = document.querySelector('.enableEthereumButton');
ethereumButton.addEventListener('click', async () => {
  web3 = new Web3(window.ethereum.currentProvider)
  checkNetworkId()
  prepareInputList()
  prepareOutputList()
  let accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  let account = accounts[0];
});
let swap = document.querySelector('.swap');
swap.addEventListener('click', async () => {
  callBridge()
});
