(function (Drupal, once) {
  'use strict';
  Drupal.behaviors.rockeskolenComposers = {
    attach: function (context) {
      once('rs-composers', '[data-rs-composers]', context).forEach(function (root) {
        const search = root.querySelector('[data-composer-search]');
        const period = root.querySelector('[data-composer-period]');
        const cards = Array.from(root.querySelectorAll('[data-composer-card]'));
        const normalize = value => value.toLocaleLowerCase('nb').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        function update() {
          const query = normalize(search.value.trim());
          let count = 0;
          cards.forEach(function (card) {
            const visible = normalize(card.dataset.search).includes(query) && (!period.value || card.dataset.period.split(' · ').includes(period.value));
            card.hidden = !visible;
            if (visible) count++;
          });
          root.querySelector('[data-composer-count]').textContent = count + (count === 1 ? ' komponist' : ' komponister');
          root.querySelector('[data-composer-empty]').hidden = count !== 0;
        }
        search.addEventListener('input', update);
        period.addEventListener('change', update);
        root.querySelector('.rs-composers__controls').hidden = false;
      });
    }
  };
})(Drupal, once);
