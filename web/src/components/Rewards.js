import React from 'react';
import { Grid, Row, Col, Panel } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { loadOwnedRewards, loadVendedRewards, loadAvailableRewards } from '../store/data/actions';
import RewardForm from './RewardForm';
import RewardRow from './RewardRow';

class Rewards extends React.Component {

  componentDidMount() {
    this.props.loadOwnedRewards();
    this.props.loadAvailableRewards();
    this.props.loadVendedRewards();
  }

  render() {
    const { t } = this.props;
    return (
        <Grid>
          <Row>
            <Col md={6}>
              <Panel>
                <Panel.Heading>
                  {t('Available Rewards')}
                </Panel.Heading>
                <Panel.Body>
                  {this.props.availableRewards.map(reward => reward.ownerId === 0 && reward.vendorId !== this.props.user.ykid &&
                    <RewardRow key={reward.id} reward={reward} showAvailable={true} />
                  )}
                </Panel.Body>
              </Panel>
            </Col>
            <Col md={6}>
              <Panel>
                <Panel.Heading>
                  {t('My Rewards')}
                </Panel.Heading>
                <Panel.Body>
                  {this.props.ownedRewards.map(reward =>
                    <RewardRow key={reward.id} reward={reward}/>
                  )}
                </Panel.Body>
              </Panel>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Panel>
                <Panel.Heading>
                  {t('Rewards you have offered')}
                </Panel.Heading>
                <Panel.Body>
                  {this.props.vendedRewards.map(reward => reward.vendorId === this.props.user.ykid &&
                    <RewardRow key={reward.id} reward={reward} showAvailable={true} />
                  )}
                </Panel.Body>
              </Panel>
            </Col>
            <Col md={6}>
              <RewardForm reward = {{}}/>
            </Col>
          </Row>
        </Grid>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    user: state.user,
    availableRewards: state.rewards.available || [],
    ownedRewards: state.rewards.owned || [],
    vendedRewards: state.rewards.vended || [],
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadAvailableRewards: () => dispatch(loadAvailableRewards()),
    loadOwnedRewards: () => dispatch(loadOwnedRewards()),
    loadVendedRewards: () => dispatch(loadVendedRewards()),
  }
}

Rewards = connect(mapStateToProps, mapDispatchToProps)(Rewards);

export default withTranslation()(Rewards);
