---
layout: default
description: "Trevor Teolis is a postdoctoral researcher at Rice University working on mathematical machine learning, kinetic equations, interacting particles, and scientific computing."
---

# Trevor Teolis

Postdoctoral Researcher, Rice University<br>
Department of Computational and Applied Mathematics & Operations Research (CMOR)<br>
Email: <a href="mailto:tt111@rice.edu">tt111@rice.edu</a>

## Research Overview

<div class="research-introduction">
<p>My background is in interacting particle systems, collective dynamics, and kinetic and hydrodynamic limits, which I studied during my PhD. Around 2023, I became interested in machine learning through the study of transformer token dynamics, which share structural similarities with models of collective dynamics such as the Kuramoto model (and also because LLMs are cool).</p>
<p>This led naturally to particle-based methods in machine learning and inference. Many modern sampling algorithms can themselves be viewed as interacting particle systems, where the particles evolve collectively in order to approximate a target probability distribution. Much of my current work can be understood through the lens of Bayesian inverse problems, which involve two central questions: how do we model the evolution of a physical system, and how do we infer its unknown parameters from observations?</p>
<p>On the forward side, I study neural operators for kinetic, fluid, and wave dynamics. We are developing new architectures and training them at scale on acoustic wave datasets.</p>
<p>On the inverse side, I develop particle-based methods for sampling posterior distributions. I am particularly interested in understanding when and how the empirical distribution of the particles converges to the target distribution as the number of particles tends to infinity.</p>
</div>

<div class="research-overview-tools"><a href="{{ '/research/' | relative_url }}">Explore research <span aria-hidden="true">→</span></a><button class="animation-toggle" type="button" aria-pressed="false">Pause animations</button></div>
<div class="research-cards">
<article class="research-card">
  <h3>Sampling &amp; particle methods</h3>
  <div class="research-animation"><canvas data-research="sampling" role="img" aria-label="RBF-kernel Stein variational gradient descent approximating a two-Gaussian target; replayed after settling."></canvas></div>
  <p>Designing interacting particle systems for efficient sampling.</p>
  <a class="research-explore" href="{{ '/research/' | relative_url }}#sampling">Explore <span aria-hidden="true">→</span><span class="visually-hidden"> Sampling &amp; particle methods</span></a>
</article>
<article class="research-card">
  <h3>Learning physical operators</h3>
  <div class="research-animation"><canvas data-research="operators" role="img" aria-label="Reference and learned prediction of the real acoustic pressure field from WaveBench, held-out sample 46169."></canvas></div>
  <p>Neural operators and foundation models for physical systems.</p>
  <a class="research-explore" href="{{ '/research/' | relative_url }}#physical-operators">Explore <span aria-hidden="true">→</span><span class="visually-hidden"> Learning physical operators</span></a>
</article>
<article class="research-card">
  <h3>Collective dynamics</h3>
  <div class="research-animation"><canvas data-research="collective" role="img" aria-label="Illustrative transformer token clustering and Cucker–Smale velocity alignment."></canvas></div>
  <p>How local interactions produce emergent macroscopic behavior.</p>
  <a class="research-explore" href="{{ '/research/' | relative_url }}#collective-dynamics">Explore <span aria-hidden="true">→</span><span class="visually-hidden"> Collective dynamics</span></a>
</article>
</div>
<p class="animation-note">SVGD and alignment simulations · WaveBench acoustic pressure fields</p>
<script src="{{ "/assets/js/research-dynamics.js" | relative_url }}" defer></script>
<script src="{{ "/assets/js/research-animations.js" | relative_url }}" defer></script>

## Background

I received my Ph.D. in Mathematics from the University of Illinois Chicago, advised by Roman Shvydkoy. My doctoral work studied collective dynamics and interacting particle systems, including Cucker--Smale, Euler alignment, and Fokker--Planck--Navier--Stokes models, and established rigorous limits from microscopic particle dynamics to kinetic and macroscopic fluid equations.

## Upcoming Conferences

- [Texas Colloquium on Distributed Learning (TL;DR 2026)](https://www.eventbrite.com/e/texas-colloquium-on-distributed-learning-tldr-2026-tickets-1988784960353)<br>
  Rice University, Houston, Texas, October 8-9, 2026.

- [SIAM Conference on Mathematics of Data Science (MDS26)](https://www.siam.org/conferences-events/siam-conferences/mds26/)<br>
  Salt Lake City, Utah, November 16-20, 2026.

- [Inverse Days 2026](https://fips.fi/inverse-days-2026/)<br>
  University of Jyväskylä, Jyväskylä, Finland, December 14-17, 2026.

## Selected Invited Talks

- “Approximating Boltzmann solution maps by averaged measure-theoretic transformers.”<br>
  Minisymposium <em>Mathematical Foundations of Learning for Infinite-Dimensional Systems and PDEs</em>, SIAM Conference on Mathematics of Data Science, Salt Lake City, Utah, November 2026. Upcoming.

- “Jump processes, stochastic in-context maps, mean-field limits, and the Boltzmann equation.”<br>
  <em>Models of Emergence and Collective Dynamics</em>, 15th AIMS Conference, Athens, Greece, July 2026.

- “Nanbu particles as stochastic in-context maps for Boltzmann dynamics.”<br>
  <em>Measure Flows for Inverse Problems and Machine Learning</em>, SIAM Conference on Uncertainty Quantification, Minneapolis, Minnesota, March 2026.

---

> _Last updated: October 2026_
