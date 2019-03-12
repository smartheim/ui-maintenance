'use strict';

/**
 * Hey you. This is a template script for openHAB.
 * Usually you start by importing openHAB script methods.
 */
scriptExtension.importPreset("RuleSupport");
scriptExtension.importPreset("RuleSimple");

/**
 * Define a rule with an "execute" method
 */
var sRule = new SimpleRule() {
    execute: function(module, input) {
        print("This is a 'hello world!' from a Javascript rule.");
    }
};

sRule.setTriggers([
    TriggerBuilder.create()
        .withId("aTimerTrigger")
        .withTypeUID("timer.GenericCronTrigger")
        .withConfiguration(
            new Configuration({
                "cronExpression": "0 * * * * ?"
            })).build()
]);

/**
 * Add your new rule to the openHAB automation manager
 */
automationManager.addRule(sRule);
