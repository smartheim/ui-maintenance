const Mixin = {
  data: function () {
    return {
      id: "",
      label: "",
      description: "",
      password: "",
      inProgress: false,
      message: null,
      messagetitle: null
    }
  },
  computed: {
    notready: function () {
      return !(this.label.trim().length > 0 && this.id.trim().length > 0 && this.password.length > 0);
    }
  },
  methods: {
    create() {

    },
    destroyed() { // Remove the vue portal
      const actions = document.querySelectorAll("#actions>.users");
      for (let action of actions) action.remove();
    },
  }
};

const mixins = [Mixin];

export { mixins };
