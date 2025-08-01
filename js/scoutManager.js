class ScoutManager {
  constructor() {
    this.storageKey = 'scouts';
  }

  addScout(name, den) {
    const scout = {
      id: this.generateId(),
      name: name,
      den: den,
      active: true
    };

    const scouts = this.getScouts();
    scouts.push(scout);
    this.saveScouts(scouts);

    return scout;
  }

  getScouts() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  getActiveScouts() {
    return this.getScouts().filter(scout => scout.active);
  }

  removeScout(id) {
    const scouts = this.getScouts();
    const scoutIndex = scouts.findIndex(scout => scout.id === id);
    
    if (scoutIndex !== -1) {
      scouts[scoutIndex].active = false;
      this.saveScouts(scouts);
    }
  }

  saveScouts(scouts) {
    localStorage.setItem(this.storageKey, JSON.stringify(scouts));
  }

  generateId() {
    return 'scout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = ScoutManager;