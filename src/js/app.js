App = {
  web3Provider: null,
  contracts: {},

  init: async function () {
    // Load pets.
    $.getJSON("../pets.json", function (data) {
      var petsRow = $("#petsRow");
      var petTemplate = $("#petTemplate");

      for (i = 0; i < data.length; i++) {
        petTemplate.find(".panel-title").text(data[i].name);
        petTemplate.find("img").attr("src", data[i].picture);
        petTemplate.find(".pet-breed").text(data[i].breed);
        petTemplate.find(".pet-age").text(data[i].age);
        petTemplate.find(".pet-location").text(data[i].location);
        petTemplate.find(".btn-adopt").attr("data-id", data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function () {
    // Modern Dapp Browsers
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request Account Access
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch {
        console.error("User denied account access");
      }
    }
    // Legacy Dapp Browsers
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // No injected web3 instance detected, fall back to local chain
    // Not suitable for production
    else {
      App.web3Provider = new Web3.providers.HttpProvider(
        "http://localhost:7545"
      );
    }
    web3 = new Web3(App.web3Provider);
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Adoption.json", (AdoptionArtifact) => {
      // Get necessary contract artifact file and instantiate it with @truffle/contract
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set provider for contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use contract to retrieve and mark adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function () {
    $(document).on("click", ".btn-adopt", App.handleAdopt);
  },

  markAdopted: function () {
    App.contracts.Adoption.deployed()
      .then((adoptionInstance) => adoptionInstance.getAdopters.call())
      .then((adopters) => {
        adopters.forEach((adopter, index) => {
          if (adopter !== "0x0000000000000000000000000000000000000000") {
            $(".panel-pet")
              .eq(index)
              .find("button")
              .text("Success")
              .attr("disabled", true);
          }
        });
      })
      .catch((err) => {
        console.log(err.message);
      });
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data("id"));

    web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.error(error);
      }

      const account = accounts[0];

      App.contracts.Adoption.deployed()
        .then((adoptionInstance) =>
          adoptionInstance.adopt(petId, { from: account })
        )
        .then((result) => App.markAdopted())
        .catch((err) => {
          console.error(err);
        });
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
