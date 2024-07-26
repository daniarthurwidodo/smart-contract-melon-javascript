/* eslint-disable no-unused-vars */
'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const { buildCCPOrg1, buildWallet } = require('./AppUtil.js');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('./CAUtil.js');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');

const jsonParser = bodyParser.json();
const app = express();
const port = 8085;



const channelName = 'mychannel';
const chaincodeName = 'mychaincode';

let mspOrg1 = 'Org1MSP';
let walletPath = path.join(__dirname, 'wallet');
let org1UserId = 'adminMelon';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}


app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.get('/get-all-asset', jsonParser, async (req, res) => {

	try {
		const gateway = new Gateway();
		const wallet = await buildWallet(Wallets, walletPath);
		const ccp = buildCCPOrg1();

		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		// Build a network instance based on the channel where the smart contract is deployed
		const network = await gateway.getNetwork(channelName);

		// Get the contract from the network.
		const contract = network.getContract(req.body.chaincodeName);
		console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
		let result = await contract.evaluateTransaction('GetAllAssets');
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);

		res.status(200).send({
			message: result.toString()
		});
	} catch (error) {
		res.status(500).send({
			error: error.toString()
		});
	}
});

app.post('/create/:chaincodeName', jsonParser, async (req, res) => {
	console.log(req.body);
	try {
		const gateway = new Gateway();
		const wallet = await buildWallet(Wallets, walletPath);
		const ccp = buildCCPOrg1();

		await gateway.connect(ccp, {
			wallet,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		// Build a network instance based on the channel where the smart contract is deployed
		const network = await gateway.getNetwork(channelName);
		const contract = network.getContract(req.params.chaincodeName);

		// Now let's try to submit a transaction.
		// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
		// to the orderer to be committed by each of the peer's to the channel ledger.
		console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
		const result = await contract.submitTransaction(
			'CreateAsset',
			[req.body.ID],
			[req.body.pengirim],
			[req.body.penerima],
			[req.body.melon],
			[req.body.tanggalTanam],
			[req.body.tanggalPanen],
			[req.body.kuantitas],
			[req.body.jenisTanaman],
			[req.body.varietas],
			[req.body.jenisTransaksi],
			[req.body.suhu],
			[req.body.harga],
			[req.body.lamaPenyimpanan],
			[req.body.timeline01],
			[req.body.timeline02],
			[req.body.timeline03],
			[req.body.timeline04],
			[req.body.timeline05],
			[req.body.timeline06],
			[req.body.timeline07],
			[req.body.timeline08],
			[req.body.timeline09],
		);
		console.log('*** Result: committed');
		if (`${result}` !== '') {
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		}

		res.status(200).send({
			message: result.toString()
		});
	} catch (error) {
		res.status(500).send({
			error: error.toString(),
			body: req.body
		});
	}
});

async function initAdmin(){
	try {
		let ccp = buildCCPOrg1();
		let caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		let wallet = await buildWallet(Wallets, walletPath);

		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
		// const gateway = new Gateway();

	} catch (error) {
		console.log(error);
	}
}
app.listen(port, () => {
	initAdmin();
	console.log(`Example app listening on port ${port}`);
});

