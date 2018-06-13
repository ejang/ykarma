var express = require('express');
var bodyParser = require("body-parser");
var router = express.Router();

var Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545/"));
const abi = [];
const contract = new web3.eth.Contract(abi, "");
const GAS = "5000000";
var communityAdminAddress = null;

// TODO: if it's a community admin, use their address if available
web3.eth.getAccounts().then((ethAccounts) => {
  communityAdminAddress = ethAccounts[0];
  console.log("from", communityAdminAddress);
});

var accounts = [];

/* GET account list */
router.get('/:communityId', function(req, res, next) {
  accounts = [];
  const communityId = parseInt(req.params.communityId);
  var method = contract.methods.getAccountCount(communityId);
  method.call(function(error, result) {
    if (error) {
      console.log('getAccountCount error', error);
    } else {
      console.log('getAccountCount result', result);
      for (var i = 0; i < result; i++) {
        getAccountFor(communityId, i, result, () => {
          console.log('callback', accounts);
          res.json(accounts);
        });
      }
    }
  })
  .catch(function(error) {
    console.log('getAccountCount call error', error);
  });
});

/* GET community details */
router.get('/:id', function(req, res, next) {
  for (var i=0; i<accounts.length; i++) {
    if (parseInt(accounts[i].id) === parseInt(req.params.id)) {
      return res.json(accounts[i]);
    }
  }
  res.json({metadata:{ name: "n/a"}});
});


/* POST new account */
router.post('/create', function(req, res, next) {
  var account = req.body.account;
  console.log("account", JSON.stringify(account));
  if (account.id !== 0) {
    res.redirect('/admin'); // account already exists
  }
  var method = contract.methods.addAccount(
    account.communityId,
    account.userAddress,
    account.metadata,
    account.urls
  );
  method.send({from:communityAdminAddress, gas: GAS}, (error, result) => {
    if (error) {
      console.log('error', error);
    } else {
      console.log('result', result);
      res.redirect('/admin');
    }
  })
  .catch(function(error) {
    console.log('call error ' + error);
  });
});

/* PUT edit account */
router.put('/:id', function(req, res, next) {
  var account = req.body.account;
  console.log("account", JSON.stringify(account));
  if (account.id === 0) {
    res.redirect('/admin'); // account not saved
  }
  var method = contract.methods.editAccount(
    account.id,
    account.communityId,
    account.userAddress,
    account.metadata,
    account.urls
  );
  method.send({from:communityAdminAddress, gas: GAS}, (error, result) => {
    if (error) {
      console.log('error', error);
    } else {
      console.log('result', result);
      res.json(account);
    }
  })
  .catch(function(error) {
    console.log('call error ' + error);
  });
});

/* DELETE remove account. */
router.delete('/:id', function(req, res, next) {
  if (req.params.id === 0) {
    res.redirect('/admin'); // account not saved
  }
  var method = contract.methods.deleteAccount(req.params.id);
  method.send({from:communityAdminAddress, gas: GAS}, (error, result) => {
    if (error) {
      console.log('error', error);
    } else {
      console.log('result', result);
      res.json({"success":"true"});
    }
  })
  .catch(function(error) {
    console.log('call error ' + error);
  });
});

function getAccountFor(i, total, callback) {
  var method = contract.methods.accountForId(i+1);
  method.call(function(error, result) {
    if (error) {
      console.log('getAccountFor error', error);
    } else {
      console.log('getAccountFor result', result);
      if (i == total-1) {
        var account = {
          id:           result[0],
          communityId:  result[1],
          userAddress:  result[2],
          metadata:     result[3],
          urls:         result[4],
        };
        accounts.push(account);
        console.log('accounts', accounts);
        callback();
      }
    }
  })
  .catch(function(error) {
    console.log('getAccountFor call error ' + i, error);
  });
}
module.exports = router;