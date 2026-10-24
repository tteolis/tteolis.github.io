---
layout: default
title: Research
permalink: /research/
description: "Sampling and particle methods, neural operators for physical systems, collective dynamics, and open problems, with interactive simulations."
page_class: research-page
research_assets: true
---

# Research

<nav class="research-topic-nav" aria-label="Research topics">
<a href="#sampling" aria-current="location">Sampling</a>
<a href="#physical-operators">Physical operators</a>
<a href="#collective-dynamics">Collective dynamics</a>
</nav>

<div id="research-content" data-simulation-src="{{ '/assets/research/simulations.json?v=' | append: site.github.build_revision | relative_url }}">
{% include research/sampling.html %}
{% include research/physical-operators.html %}
{% include research/collective-dynamics.html %}
{% include research/open-problems.html %}
<noscript><p>The research discussions and figures are available without JavaScript. The interactive particle simulations require JavaScript.</p></noscript>
</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js" defer></script>
<script src="{{ '/assets/js/research-page.js?v=' | append: site.github.build_revision | relative_url }}" defer></script>

<script src="{{ '/assets/js/research-navigation.js?v=' | append: site.github.build_revision | relative_url }}" defer></script>
