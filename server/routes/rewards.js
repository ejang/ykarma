var express = require('express');
var router = express.Router();
var bodyParser = require("body-parser");
var eth = require('./eth');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var fromAccount = null;
eth.web3.eth.getAccounts().then((accounts) => {
  fromAccount = accounts[0];
});

const ADMIN_ID = 1;

/* GET individual reward */
router.get('/:id', function(req, res, next) {
  const id = parseInt(req.params.id);
  getRewardFor(id, (reward) => {
    //console.log('callback', reward);
    res.json({"success":true, "reward":reward});
  });
});

/* GET my rewards owned list */
router.get('/ownedBy/:accountId', function(req, res, next) {
  const ownerId = parseInt(req.params.accountId);
  console.log("getting rewards owned by", ownerId);
  return getListOfRewards(true, ownerId, res);
});

/* GET my rewards vended list */
router.get('/vendedBy/:accountId', function(req, res, next) {
  const vendorId = parseInt(req.params.accountId);
  console.log("getting rewards vended by", vendorId);
  return getListOfRewards(false, vendorId, res);
});

function getListOfRewards(isOwner, accountId, res) {
  var rewards = [];
  const method = eth.contract.methods.getRewardsCount(accountId, isOwner);
  method.call(function(error, totalRewards) {
    if (error) {
      console.log('getListOfRewards error', error);
      return res.json({"success":false, "error": error});
    } else {
      //console.log('getRewardsOwnedCount result', totalRewards);
      if (parseInt(totalRewards)===0) {
        return res.json({"success":true, "rewards":[]});
      }
      for (var i = 0; i < totalRewards; i++) {
        getRewardByIndex(isOwner, accountId, i, (reward) => {
          rewards.push(reward);
          if (rewards.length >= totalRewards) {
            // console.log('rewards', rewards);
            return res.json({"success":true, "rewards":rewards});
          }
        });
      }
    }
  })
  .catch(function(error) {
    console.log('getListOfRewards call error', error);
  });
}

// TODO
/* GET my rewards available list */
router.get('/availableTo/:accountId', function(req, res, next) {
  if (!req.session.ykid) {
    return res.json({"success":false, "error": "Not logged in"});
  }
});

/* POST create a reward */
router.post('/create', function(req, res, next) {
  if (!req.session.ykid) {
    return res.json({"success":false, "error": "Not logged in"});
  }
  var reward = req.body.reward;
  //console.log("reward", reward);
  var notifying = false;
  var method = eth.contract.methods.addNewReward(req.session.ykid, reward.cost, reward.tag, reward.metadata, reward.flags);
  method.send({from:fromAccount, gas: eth.GAS}).on('error', (error) => {
    console.log('error', error);
    res.json({'success':false, 'error':error});
  })
  .on('confirmation', (number, receipt) => {
    if (number >= 1 && !notifying) {
      notifying = true;
      //console.log('result', receipt);
      return res.json({"success":true, "result": receipt});
    }
  })
  .catch(function(error) {
    console.log('create reward call error ' + error);
    res.json({"success":false, "error": error});
  });
});

/* PUT update a reward */
router.put('/update', function(req, res, next) {
  if (!req.session.ykid) {
    return res.json({"success":false, "error": "Not logged in"});
  }
  var notifying = false;
  var reward = req.body.reward;
  getRewardFor(reward.id, (existing) => {
    if (req.session.ykid !== parseInt(existing.vendorId) && req.session.ykid !== ADMIN_ID) {
      return res.json({"success":false, "error": "Not authorized"});
    }
    //console.log("existing", existing);
    var method = eth.contract.methods.editExistingReward(reward.id, reward.cost || existing.cost, reward.tag || existing.tag, reward.metadata || existing.metadata, reward.flags || existing.flags);
    method.send({from:fromAccount, gas: eth.GAS}).on('error', (error) => {
      console.log('error', error);
      res.json({'success':false, 'error':error});
    })
    .on('confirmation', (number, receipt) => {
      if (number >= 1 && !notifying) {
        notifying = true;
        //console.log('result', receipt);
        return res.json({"success":true, "result": receipt});
      }
    })
  })
});

/* DELETE delete a reward */
router.delete('/:id', function(req, res, next) {
  if (!req.session.ykid) {
    return res.json({"success":false, "error": "Not logged in"});
  }
  var notifying = false;
  getRewardFor(req.params.id, (existing) => {
    if (req.session.ykid != existing.vendorId && req.session.ykid != ADMIN_ID) {
      return res.json({"success":false, "error": "Not authorized"});
    }
    var method = eth.contract.methods.deleteReward(existing.id);
    method.send({from:fromAccount, gas: eth.GAS}).on('error', (error) => {
      console.log('error', error);
      res.json({'success':false, 'error':error});
    })
    .on('confirmation', (number, receipt) => {
      if (number >= 1 && !notifying) {
        notifying = true;
        //console.log('result', receipt);
        res.json({"success":true, "result": receipt});
      }
    })
  });
});

function getRewardFor(id, callback) {
  var method = eth.contract.methods.rewardForId(id);
  method.call(function(error, result) {
    if (error) {
      console.log('getRewardFor error', error);
      callback({});
    } else {
      //console.log('getRewardFor result', result);
      var reward = getRewardFromResult(result);
      callback(reward);
    }
  })
  .catch(function(error) {
    console.log('getAccountFor call error ' + id, error);
    callback({});
  });
}

function getRewardByIndex(isOwner, accountId, idx, callback) {
  const method = eth.contract.methods.rewardByIdx(accountId, idx, isOwner);
  method.call(function(error, result) {
    if (error) {
      console.log('getRewardByIndex error', error);
    } else {
      var reward = getRewardFromResult(result);
      callback(reward);
    }
  })
  .catch(function(error) {
    console.log('getRewardByIndex call error ' + id, error);
    callback({});
  });
}

function getRewardFromResult(result) {
  // console.log("result",result);
  return {
    id:       result[0],
    vendorId: result[1],
    ownerId:  result[2],
    cost:     result[3],
    flags:    result[4],
    tags:     result[5],
    metadata: JSON.parse(result[6] || '{}'),
  };
}


module.exports = router;
