// @flow
import * as React from 'react'
import Block from '~/components/layout/Block'
import Col from '~/components/layout/Col'
import Bold from '~/components/layout/Bold'
import Img from '~/components/layout/Img'
import Paragraph from '~/components/layout/Paragraph'
import Row from '~/components/layout/Row'
import { type Safe } from '~/routes/safe/store/model/safe'
import List from 'material-ui/List'

import Withdrawn from '~/routes/safe/component/Withdrawn'

import Address from './Address'
import Balance from './Balance'
import Owners from './Owners'
import Confirmations from './Confirmations'
import DailyLimit from './DailyLimit'

const safeIcon = require('./assets/gnosis_safe.svg')

type SafeProps = {
  safe: Safe,
  balance: string,
}

type State = {
  component: React$Node,
}

const listStyle = {
  width: '100%',
}

class GnoSafe extends React.PureComponent<SafeProps, State> {
  state = {
    component: undefined,
  }

  onWithdrawn = () => {
    this.setState({ component: <Withdrawn /> })
  }

  render() {
    const { safe, balance } = this.props
    const { component } = this.state

    return (
      <Row grow>
        <Col sm={12} top="xs" md={6} margin="xl" overflow>
          <List style={listStyle}>
            <Balance balance={balance} />
            <Owners owners={safe.owners} />
            <Confirmations confirmations={safe.get('confirmations')} />
            <Address address={safe.get('address')} />
            <DailyLimit limit={safe.get('dailyLimit')} onWithdrawn={this.onWithdrawn} />
          </List>
        </Col>
        <Col sm={12} center="xs" md={6} margin="xl" layout="column">
          <Block margin="xl">
            <Paragraph size="lg" noMargin align="right">
              <Bold>{safe.name.toUpperCase()}</Bold>
            </Paragraph>
          </Block>
          <Row grow align={component ? undefined : 'center'}>
            { component || <Img alt="Safe Icon" src={safeIcon} height={330} /> }
          </Row>
        </Col>
      </Row>
    )
  }
}

/*
        <Paragraph size="lg">
          <Bold>{safe.name.toUpperCase()}</Bold>
*/
export default GnoSafe
