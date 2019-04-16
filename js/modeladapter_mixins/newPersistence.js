const Mixin = {
  data: function () {
    return {
      id: "",
      label: "",
      inProgress: false,
      message: null,
      messagetitle: null
    }
  },
  computed: {
    notready: function () {
      return !(this.label.trim().length > 0 && this.id.trim().length > 0);
    }
  },
  methods: {
    create() {

    },
    destroyed() {
      const actions = document.querySelectorAll("#actions>.persistence");
      for (let action of actions) action.remove();
    },
  }
};

const mixins = [Mixin];

export { mixins };
